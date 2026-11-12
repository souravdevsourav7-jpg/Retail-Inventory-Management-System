
// =====================================================
// IMPORTS
// =====================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");

const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

// =====================================================
// APP SETUP
// =====================================================

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  const required = [
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "DB_CA_CERT",
    "JWT_SECRET",
  ];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    return res.status(503).json({
      status: "error",
      message: "Backend configuration is incomplete",
      missingEnvironmentVariables: missing,
      emailConfigured: Boolean(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD),
    });
  }

  db.query("SELECT 1 AS ok", (error) => {
    if (error) {
      console.error("HEALTH CHECK DATABASE ERROR:", error.message);
      return res.status(503).json({
        status: "error",
        database: "disconnected",
        emailConfigured: Boolean(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD),
      });
    }

    return res.json({
      status: "ok",
      database: "connected",
      emailConfigured: Boolean(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD),
    });
  });
});

// Initialize the database once per server instance.
let databaseInitialization = null;

function initializeDatabase() {
  if (!databaseInitialization) {
    databaseInitialization = new Promise((resolve, reject) => {
      createRequiredTables((tableError) => {
        if (tableError) return reject(tableError);

        ensureProductImageColumn((imageError) => {
          if (imageError) return reject(imageError);

          setupOrdersTable((setupError) => {
            if (setupError) return reject(setupError);
            resolve();
          });
        });
      });
    }).catch((error) => {
      databaseInitialization = null;
      throw error;
    });
  }

  return databaseInitialization;
}

app.use((req, res, next) => {
  initializeDatabase()
    .then(() => next())
    .catch((error) => {
      console.error("DATABASE INITIALIZATION ERROR:", error.message);
      res.status(503).json({
        message: "Database is temporarily unavailable",
      });
    });
});

const PORT = process.env.PORT || 5000;

// =====================================================
// EMAIL TRANSPORTER
// =====================================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error(
      "Email transporter error:",
      error.message
    );
  } else {
    console.log("Email transporter is ready");
  }
});

// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "Retail Inventory Backend is running",
  });
});

// =====================================================
// SEND OTP
// =====================================================

app.post("/api/send-otp", async (req, res) => {
  try {
    const email = req.body && req.body.email;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        message: "A valid email is required",
      });
    }

    const emailKey = email.trim().toLowerCase();
    const otp = crypto.randomInt(100000, 1000000).toString();

    db.query(
      `INSERT INTO email_verifications
       (email, otp, expires_at, verified)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0)
       ON DUPLICATE KEY UPDATE
         otp = VALUES(otp),
         expires_at = VALUES(expires_at),
         verified = 0`,
      [emailKey, otp],
      async (dbError) => {
        if (dbError) {
          console.error("SAVE OTP ERROR:", dbError.message);
          return res.status(500).json({
            message: "Could not create email verification",
          });
        }

        try {
          const otpHtml = [
            '<div style="font-family: Arial, sans-serif; padding: 20px;">',
            "<h2>Retail Inventory</h2>",
            "<p>Your email verification OTP is:</p>",
            '<h1 style="letter-spacing: 8px;">' + otp + "</h1>",
            "<p>This OTP will expire in 5 minutes.</p>",
            "<p>If you did not request this OTP, please ignore this email.</p>",
            "</div>",
          ].join("");

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: emailKey,
            subject: "Retail Inventory - Email Verification OTP",
            html: otpHtml,
          });

          console.log("OTP SENT TO:", emailKey);
          return res.json({
            message: "OTP sent successfully",
          });
        } catch (mailError) {
          console.error("SEND OTP EMAIL ERROR:", mailError.message);
          return res.status(500).json({
            message: "Failed to send OTP email",
          });
        }
      }
    );
  } catch (error) {
    console.error("SEND OTP ERROR:", error.message);
    return res.status(500).json({
      message: "Failed to send OTP",
    });
  }
});

// =====================================================
// VERIFY OTP
// =====================================================

app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body || {};

  if (
    typeof email !== "string" ||
    !email.trim() ||
    otp === undefined ||
    otp === null
  ) {
    return res.status(400).json({
      message: "Email and OTP are required",
    });
  }

  const emailKey = email.trim().toLowerCase();
  const submittedOtp = String(otp).trim();

  db.query(
    `SELECT otp
     FROM email_verifications
     WHERE email = ? AND verified = 0 AND expires_at > NOW()`,
    [emailKey],
    (err, rows) => {
      if (err) {
        console.error("VERIFY OTP DATABASE ERROR:", err.message);
        return res.status(500).json({
          message: "Could not verify OTP",
        });
      }

      if (!rows || rows.length === 0) {
        return res.status(400).json({
          message: "OTP not found or expired",
        });
      }

      if (rows[0].otp !== submittedOtp) {
        return res.status(400).json({
          message: "Invalid OTP",
        });
      }

      db.query(
        `UPDATE email_verifications
         SET verified = 1, otp = NULL
         WHERE email = ?`,
        [emailKey],
        (updateError) => {
          if (updateError) {
            console.error(
              "MARK EMAIL VERIFIED ERROR:",
              updateError.message
            );
            return res.status(500).json({
              message: "Could not complete email verification",
            });
          }

          console.log("EMAIL VERIFIED:", emailKey);
          return res.json({
            message: "Email verified successfully",
          });
        }
      );
    }
  );
});

function hashPassword(password, callback) {
  crypto.randomBytes(16, (saltError, salt) => {
    if (saltError) return callback(saltError);

    crypto.scrypt(password, salt, 64, (hashError, derivedKey) => {
      if (hashError) return callback(hashError);
      callback(null, "scrypt$" + salt.toString("hex") + "$" + derivedKey.toString("hex"));
    });
  });
}

function verifyPassword(password, storedPassword, callback) {
  if (typeof storedPassword !== "string" || !storedPassword.startsWith("scrypt$")) {
    return callback(null, storedPassword === password, true);
  }

  const parts = storedPassword.split("$");
  if (!parts[1] || !parts[2]) return callback(null, false, false);

  const expected = Buffer.from(parts[2], "hex");
  crypto.scrypt(password, Buffer.from(parts[1], "hex"), expected.length, (error, actual) => {
    if (error) return callback(error);

    const valid =
      expected.length === actual.length &&
      crypto.timingSafeEqual(expected, actual);

    callback(null, valid, false);
  });
}

// =====================================================
// REGISTER USER
// =====================================================

app.post("/api/register", (req, res) => {
  const { name, email, mobile, password } = req.body || {};

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof mobile !== "string" ||
    typeof password !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !mobile.trim() ||
    !password
  ) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password must be at least 6 characters",
    });
  }

  const emailKey = email.trim().toLowerCase();

  db.query(
    "SELECT email FROM email_verifications WHERE email = ? AND verified = 1",
    [emailKey],
    (verifyError, verificationRows) => {
      if (verifyError) {
        console.error(
          "CHECK EMAIL VERIFICATION ERROR:",
          verifyError.message
        );
        return res.status(500).json({
          message: "Could not verify registration status",
        });
      }

      if (!verificationRows || verificationRows.length === 0) {
        return res.status(400).json({
          message: "Please verify your email first",
        });
      }

      db.query(
        "SELECT id FROM users WHERE email = ?",
        [emailKey],
        (err, results) => {
          if (err) {
            console.error("CHECK USER ERROR:", err.message);
            return res.status(500).json({
              message: "Database error while checking user",
            });
          }

          if (results.length > 0) {
            return res.status(409).json({
              message: "An account with this email already exists",
            });
          }

          const sql =
            "INSERT INTO users (name, email, mobile, password, role) VALUES (?, ?, ?, ?, ?)";

          hashPassword(password, (hashError, passwordHash) => {
            if (hashError) {
              console.error("PASSWORD HASH ERROR:", hashError.message);
              return res.status(500).json({
                message: "Could not securely create the account",
              });
            }

            db.query(
              sql,
              [name.trim(), emailKey, mobile.trim(), passwordHash, "user"],
              (insertErr, result) => {
                if (insertErr) {
                  console.error("REGISTER ERROR:", insertErr.message);
                  return res.status(500).json({
                    message: "Account could not be created",
                  });
                }

                db.query(
                  "DELETE FROM email_verifications WHERE email = ?",
                  [emailKey],
                  () => {}
                );

                console.log("USER REGISTERED:", result.insertId);
                return res.status(201).json({
                  message: "Account created successfully",
                  userId: result.insertId,
                });
              }
            );
          });
        }
      );
    }
  );
});

// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  const token =
    authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Access token required",
    });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    (err, user) => {
      if (err) {
        console.error("JWT ERROR:", err.message);

        return res.status(403).json({
          message: "Invalid or expired token",
        });
      }

      req.user = user;
      next();
    }
  );
}

// =====================================================
// ADMIN MIDDLEWARE
// =====================================================

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
}

// =====================================================
// USER MIDDLEWARE
// =====================================================

function requireUser(req, res, next) {
  if (!req.user || req.user.role !== "user") {
    return res.status(403).json({
      message: "User access required",
    });
  }

  next();
}

// =====================================================
// LOGIN
// =====================================================

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const emailKey = email.trim().toLowerCase();

  db.query("SELECT * FROM users WHERE email = ?", [emailKey], (err, results) => {
    if (err) {
      console.error("LOGIN ERROR:", err.message);
      return res.status(500).json({ message: "Database error" });
    }

    if (!results || results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = results[0];

    verifyPassword(password, user.password, (verifyError, valid, isLegacyPassword) => {
      if (verifyError) {
        console.error("PASSWORD VERIFY ERROR:", verifyError.message);
        return res.status(500).json({ message: "Could not verify credentials" });
      }

      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const issueToken = () => {
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        return res.json({
          message: "Login successful",
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      };

      if (!isLegacyPassword) return issueToken();

      hashPassword(password, (hashError, passwordHash) => {
        if (hashError) {
          console.error("LEGACY PASSWORD HASH ERROR:", hashError.message);
          return res.status(500).json({ message: "Could not secure account credentials" });
        }

        db.query(
          "UPDATE users SET password = ? WHERE id = ?",
          [passwordHash, user.id],
          (updateError) => {
            if (updateError) {
              console.error("LEGACY PASSWORD UPDATE ERROR:", updateError.message);
              return res.status(500).json({ message: "Could not secure account credentials" });
            }
            return issueToken();
          }
        );
      });
    });
  });
});

// =====================================================
// USERS / CUSTOMERS - ADMIN
// =====================================================

app.get(
  "/api/users",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    db.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.mobile,
        u.role,
        COUNT(o.id) AS total_orders,
        COALESCE(
          SUM(
            CASE
              WHEN o.payment_status != 'Failed'
              THEN COALESCE(o.total, o.amount, 0)
              ELSE 0
            END
          ), 0
        ) AS total_spent,
        MAX(o.created_at) AS latest_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id, u.name, u.email, u.mobile, u.role
      ORDER BY total_orders DESC, u.id DESC
      `,
      (err, results) => {
        if (err) {
          return res.status(500).json({
            message: "Failed to fetch users",
            error: err.message,
          });
        }

        res.json(results);
      }
    );
  }
);

// =====================================================
// CUSTOMER ORDERS
// =====================================================

app.get(
  "/api/customers/:id/orders",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    db.query(
      `
      SELECT
        o.id,
        o.user_id,
        o.product_id,
        o.quantity,
        COALESCE(o.amount, o.total, 0) AS amount,
        COALESCE(o.price, p.price, 0) AS price,
        COALESCE(o.order_status, o.status, 'Processing') AS order_status,
        COALESCE(o.payment_status, 'Pending') AS payment_status,
        COALESCE(o.current_location, 'Warehouse') AS current_location,
        o.created_at,
        COALESCE(p.name, CONCAT('Product #', o.product_id)) AS product_name,
        p.image AS product_image,
        p.category AS product_category,
        u.name AS user_name,
        u.email AS user_email,
        u.mobile AS user_mobile
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.user_id = ?
      ORDER BY o.id DESC
      `,
      [req.params.id],
      (err, results) => {
        if (err) {
          console.error("GET CUSTOMER ORDERS ERROR:", err);
          return res.status(500).json({
            message: "Failed to fetch customer orders",
            error: err.message,
          });
        }

        res.json(results);
      }
    );
  }
);

// =====================================================
// IMAGE UPLOAD
// =====================================================

// Vercel's function filesystem is temporary. Store small images in MySQL
// so product photos survive cold starts and future deployments.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      const error = new Error("Only JPG, PNG, WEBP, and GIF images are allowed");
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

function uploadedImageDataUrl(file) {
  if (!file) return null;
  return "data:" + file.mimetype + ";base64," + file.buffer.toString("base64");
}

// Continue serving any legacy, repository-tracked images.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =====================================================
// PRODUCTS - GET
// =====================================================

app.get(
  "/api/products",
  authenticateToken,
  (req, res) => {
    db.query(
      `
      SELECT *
      FROM products
      ORDER BY id DESC
      `,
      (err, results) => {
        if (err) {
          console.error("GET PRODUCTS ERROR:", err);

          return res.status(500).json({
            message: "Failed to fetch products",
            error: err.message,
          });
        }

        res.json(results);
      }
    );
  }
);

// =====================================================
// PRODUCTS - CREATE
// =====================================================

app.post(
  "/api/products",
  authenticateToken,
  requireAdmin,
  upload.single("image"),
  (req, res) => {
    const {
      name,
      category,
      price,
      stock,
      quantity,
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        message: "Product name and price are required",
      });
    }

    const image = uploadedImageDataUrl(req.file);

    const finalStock = Number(
      stock !== undefined ? stock : (quantity || 0)
    );

    const sql = `
      INSERT INTO products
      (name, category, price, stock, image)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [
        name,
        category || "",
        Number(price),
        finalStock,
        image,
      ],
      (err, result) => {
        if (err) {
          console.error("CREATE PRODUCT ERROR:", err);

          return res.status(500).json({
            message: "Failed to create product",
            error: err.message,
          });
        }

        const newProductId = result.insertId;

        db.query(
          `INSERT INTO inventory
           (product_id, quantity, min_stock, updated_at)
           VALUES (?, ?, 10, NOW())
           ON DUPLICATE KEY UPDATE
           quantity = VALUES(quantity),
           updated_at = NOW()`,
          [newProductId, finalStock],
          () => {}
        );

        res.status(201).json({
          message: "Product created successfully",
          productId: newProductId,
        });
      }
    );
  }
);

// =====================================================
// PRODUCTS - UPDATE
// =====================================================

app.put(
  "/api/products/:id",
  authenticateToken,
  requireAdmin,
  upload.single("image"),
  (req, res) => {
    const productId = req.params.id;

    const {
      name,
      category,
      price,
      stock,
      quantity,
    } = req.body;

    const finalStock = Number(
      stock !== undefined ? stock : (quantity || 0)
    );

    let sql;
    let values;

    if (req.file) {
      const image = uploadedImageDataUrl(req.file);

      sql = `
        UPDATE products
        SET
          name = ?,
          category = ?,
          price = ?,
          stock = ?,
          image = ?
        WHERE id = ?
      `;

      values = [
        name,
        category || "",
        Number(price),
        finalStock,
        image,
        productId,
      ];
    } else {
      sql = `
        UPDATE products
        SET
          name = ?,
          category = ?,
          price = ?,
          stock = ?
        WHERE id = ?
      `;

      values = [
        name,
        category || "",
        Number(price),
        finalStock,
        productId,
      ];
    }

    db.query(sql, values, (err) => {
      if (err) {
        console.error("UPDATE PRODUCT ERROR:", err);

        return res.status(500).json({
          message: "Failed to update product",
          error: err.message,
        });
      }

      db.query(
        `INSERT INTO inventory
         (product_id, quantity, min_stock, updated_at)
         VALUES (?, ?, 10, NOW())
         ON DUPLICATE KEY UPDATE
         quantity = VALUES(quantity),
         updated_at = NOW()`,
        [productId, finalStock],
        () => {}
      );

      res.json({
        message: "Product updated successfully",
      });
    });
  }
);

// =====================================================
// PRODUCTS - DELETE
// =====================================================

app.delete(
  "/api/products/:id",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const productId = req.params.id;

    db.query(
      "SELECT COUNT(*) AS orderCount FROM orders WHERE product_id = ?",
      [productId],
      (chkErr, chkRows) => {
        if (chkErr) {
          console.error("CHECK PRODUCT ORDERS ERROR:", chkErr);

          return res.status(500).json({
            message: "Failed to check product order history",
            error: chkErr.message,
          });
        }

        const orderCount = chkRows[0]?.orderCount || 0;

        if (orderCount > 0) {
          return res.status(400).json({
            message:
              `Cannot delete product because it is linked to ${orderCount} customer order(s). Please set its stock to 0 or mark it out of stock instead.`,
            orderCount,
          });
        }

        db.query(
          "DELETE FROM inventory WHERE product_id = ?",
          [productId],
          (invErr) => {
            if (invErr) {
              console.error("DELETE INVENTORY ERROR:", invErr);
              return res.status(500).json({
                message: "Failed to delete inventory record",
                error: invErr.message,
              });
            }

            db.query(
              "DELETE FROM products WHERE id = ?",
              [productId],
              (err) => {
                if (err) {
                  console.error("DELETE PRODUCT ERROR:", err);

                  return res.status(500).json({
                    message: "Failed to delete product",
                    error: err.message,
                  });
                }

                res.json({
                  message: "Product deleted successfully",
                });
              }
            );
          }
        );
      }
    );
  }
);

// =====================================================
// CATEGORIES - GET
// =====================================================

app.get(
  "/api/categories",
  authenticateToken,
  (req, res) => {
    db.query(
      `
      SELECT
        c.id,
        c.name,
        COALESCE(c.description, '') AS description,
        COUNT(p.id) AS product_count,
        COALESCE(SUM(p.stock), 0) AS total_stock
      FROM categories c
      LEFT JOIN products p
        ON LOWER(TRIM(c.name)) = LOWER(TRIM(p.category))
      GROUP BY c.id, c.name, c.description
      ORDER BY c.name ASC
      `,
      (err, results) => {
        if (err) {
          console.error("GET CATEGORIES ERROR:", err);

          return res.status(500).json({
            message: "Failed to fetch categories",
            error: err.message,
          });
        }

        res.json(results);
      }
    );
  }
);

// =====================================================
// CATEGORIES - CREATE
// =====================================================

app.post(
  "/api/categories",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    db.query(
      `
      INSERT INTO categories (name, description)
      VALUES (?, ?)
      `,
      [name, description || ""],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            message: "Failed to create category",
            error: err.message,
          });
        }

        res.status(201).json({
          message: "Category created successfully",
          categoryId: result.insertId,
        });
      }
    );
  }
);

// =====================================================
// CATEGORIES - UPDATE
// =====================================================

app.put(
  "/api/categories/:id",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const categoryId = req.params.id;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const newName = name.trim();
    const newDesc = description ? description.trim() : "";

    db.query(
      "SELECT name FROM categories WHERE id = ?",
      [categoryId],
      (findErr, rows) => {
        if (findErr) {
          return res.status(500).json({
            message: "Database error while fetching category",
            error: findErr.message,
          });
        }

        if (!rows || rows.length === 0) {
          return res.status(404).json({
            message: "Category not found",
          });
        }

        const oldName = rows[0].name;

        db.query(
          `
          UPDATE categories
          SET name = ?, description = ?
          WHERE id = ?
          `,
          [newName, newDesc, categoryId],
          (updateErr) => {
            if (updateErr) {
              return res.status(500).json({
                message: "Failed to update category",
                error: updateErr.message,
              });
            }

            if (oldName.toLowerCase() !== newName.toLowerCase()) {
              db.query(
                `UPDATE products
                 SET category = ?
                 WHERE LOWER(TRIM(category)) = LOWER(TRIM(?))`,
                [newName, oldName],
                (prodUpdErr) => {
                  if (prodUpdErr) {
                    console.error(
                      "CASCADE CATEGORY UPDATE ERROR:",
                      prodUpdErr
                    );
                  }
                }
              );
            }

            res.json({
              message: "Category updated successfully",
            });
          }
        );
      }
    );
  }
);

// =====================================================
// CATEGORIES - DELETE
// =====================================================

app.delete(
  "/api/categories/:id",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const categoryId = req.params.id;

    db.query(
      "SELECT name FROM categories WHERE id = ?",
      [categoryId],
      (findErr, rows) => {
        if (findErr) {
          return res.status(500).json({
            message: "Failed to find category",
            error: findErr.message,
          });
        }

        if (!rows || rows.length === 0) {
          return res.status(404).json({
            message: "Category not found",
          });
        }

        const catName = rows[0].name;

        db.query(
          `SELECT COUNT(*) AS count
           FROM products
           WHERE LOWER(TRIM(category)) = LOWER(TRIM(?))`,
          [catName],
          (chkErr, chkRows) => {
            if (chkErr) {
              return res.status(500).json({
                message: "Failed to verify category usage",
                error: chkErr.message,
              });
            }

            const count = chkRows[0]?.count || 0;

            if (count > 0) {
              return res.status(400).json({
                message:
                  `Cannot delete category "${catName}" because it currently has ${count} associated product(s). Reassign or delete these products first.`,
                productCount: count,
              });
            }

            db.query(
              "DELETE FROM categories WHERE id = ?",
              [categoryId],
              (err) => {
                if (err) {
                  return res.status(500).json({
                    message: "Failed to delete category",
                    error: err.message,
                  });
                }

                res.json({
                  message: "Category deleted successfully",
                });
              }
            );
          }
        );
      }
    );
  }
);

// =====================================================
// INVENTORY - GET
// =====================================================

app.get(
  "/api/inventory",
  authenticateToken,
  (req, res) => {
    db.query(
      `
      SELECT
        p.id,
        p.name,
        p.id AS product_id,
        p.name AS product_name,
        p.category,
        p.price,
        p.stock,
        p.image,
        i.id AS inventory_id,
        p.stock AS quantity,
        COALESCE(i.min_stock, 10) AS min_stock,
        i.updated_at
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      ORDER BY p.id DESC
      `,
      (err, results) => {
        if (err) {
          console.error("GET INVENTORY ERROR:", err);

          return res.status(500).json({
            message: "Failed to fetch inventory",
            error: err.message,
          });
        }

        res.json(results);
      }
    );
  }
);

// =====================================================
// INVENTORY - CREATE
// =====================================================

app.post(
  "/api/inventory",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const {
      product_id,
      warehouse_id,
      quantity,
      min_stock,
    } = req.body;

    if (!product_id || quantity === undefined) {
      return res.status(400).json({
        message: "Product and quantity are required",
      });
    }

    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    const minStk =
      min_stock !== undefined
        ? Math.max(0, parseInt(min_stock, 10) || 0)
        : 10;

    db.query(
      "UPDATE products SET stock = ? WHERE id = ?",
      [qty, product_id],
      (productError, productResult) => {
        if (productError) {
          return res.status(500).json({
            message: "Failed to update product stock",
            error: productError.message,
          });
        }

        if (productResult.affectedRows === 0) {
          return res.status(404).json({
            message: "Product not found",
          });
        }

        db.query(
          `
          INSERT INTO inventory
          (product_id, warehouse_id, quantity, min_stock)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            warehouse_id = VALUES(warehouse_id),
            quantity = VALUES(quantity),
            min_stock = VALUES(min_stock),
            updated_at = NOW()
          `,
          [product_id, warehouse_id || null, qty, minStk],
          (err, result) => {
            if (err) {
              console.error("CREATE INVENTORY ERROR:", err);

              return res.status(500).json({
                message: "Failed to create inventory",
                error: err.message,
              });
            }

            res.status(201).json({
              message: "Inventory saved successfully",
              inventoryId: result.insertId || null,
            });
          }
        );
      }
    );
  }
);

// =====================================================
// INVENTORY - UPDATE BY INVENTORY ID
// =====================================================

app.put(
  "/api/inventory/:id",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const { quantity, min_stock } = req.body;
    const invId = req.params.id;

    const newQty = Math.max(0, parseInt(quantity, 10) || 0);
    const minStk =
      min_stock !== undefined
        ? Math.max(0, parseInt(min_stock, 10) || 0)
        : 10;

    db.query(
      "SELECT product_id FROM inventory WHERE id = ?",
      [invId],
      (err, rows) => {
        if (err) {
          return res.status(500).json({
            message: "Failed to find inventory",
            error: err.message,
          });
        }

        if (!rows || rows.length === 0) {
          return res.status(404).json({
            message: "Inventory record not found",
          });
        }

        const productId = rows[0].product_id;

        db.query(
          "UPDATE products SET stock = ? WHERE id = ?",
          [newQty, productId],
          (productError) => {
            if (productError) {
              return res.status(500).json({
                message: "Failed to update product stock",
                error: productError.message,
              });
            }

            db.query(
              `
              UPDATE inventory
              SET quantity = ?, min_stock = ?, updated_at = NOW()
              WHERE id = ?
              `,
              [newQty, minStk, invId],
              (updateErr) => {
                if (updateErr) {
                  return res.status(500).json({
                    message: "Failed to update inventory",
                    error: updateErr.message,
                  });
                }

                res.json({
                  message: "Inventory updated successfully",
                });
              }
            );
          }
        );
      }
    );
  }
);

// =====================================================
// INVENTORY - UPDATE DIRECTLY BY PRODUCT ID
// =====================================================

app.put(
  "/api/inventory/stock/:productId",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const productId = req.params.productId;
    const { stock, min_stock } = req.body;

    const newStock = Math.max(0, parseInt(stock, 10) || 0);
    const minStk =
      min_stock !== undefined
        ? Math.max(0, parseInt(min_stock, 10) || 0)
        : 10;

    db.query(
      "UPDATE products SET stock = ? WHERE id = ?",
      [newStock, productId],
      (pErr, productResult) => {
        if (pErr) {
          console.error("PRODUCT STOCK UPDATE ERROR:", pErr);

          return res.status(500).json({
            message: "Failed to update product stock",
            error: pErr.message,
          });
        }

        if (productResult.affectedRows === 0) {
          return res.status(404).json({
            message: "Product not found",
          });
        }

        db.query(
          `
          INSERT INTO inventory
          (product_id, quantity, min_stock, updated_at)
          VALUES (?, ?, ?, NOW())
          ON DUPLICATE KEY UPDATE
            quantity = VALUES(quantity),
            min_stock = VALUES(min_stock),
            updated_at = NOW()
          `,
          [productId, newStock, minStk],
          (iErr) => {
            if (iErr) {
              return res.status(500).json({
                message: "Failed to update inventory",
                error: iErr.message,
              });
            }

            res.json({
              message: "Stock updated successfully",
              productId,
              stock: newStock,
              min_stock: minStk,
            });
          }
        );
      }
    );
  }
);

// =====================================================
// INVENTORY - DELETE
// =====================================================

app.delete(
  "/api/inventory/:id",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    db.query(
      "DELETE FROM inventory WHERE id = ?",
      [req.params.id],
      (err) => {
        if (err) {
          return res.status(500).json({
            message: "Failed to delete inventory",
            error: err.message,
          });
        }

        res.json({
          message: "Inventory deleted successfully",
        });
      }
    );
  }
);

// =====================================================
// CREATE REQUIRED DATABASE TABLES
// =====================================================

function createRequiredTables(callback) {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      mobile VARCHAR(20) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user'
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(255) DEFAULT '',
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      stock INT NOT NULL DEFAULT 0,
      image MEDIUMTEXT
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description VARCHAR(255) DEFAULT ''
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS inventory (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL UNIQUE,
      warehouse_id VARCHAR(100) DEFAULT NULL,
      quantity INT NOT NULL DEFAULT 0,
      min_stock INT NOT NULL DEFAULT 10,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      total DECIMAL(10,2) NOT NULL DEFAULT 0,
      payment_status VARCHAR(50) DEFAULT 'Pending',
      order_status VARCHAR(50) DEFAULT 'Processing',
      status VARCHAR(50) DEFAULT 'Processing',
      current_location VARCHAR(255) DEFAULT 'Warehouse',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id),
      CONSTRAINT fk_orders_product
        FOREIGN KEY (product_id) REFERENCES products(id)
    ) ENGINE=InnoDB`,

    `CREATE TABLE IF NOT EXISTS email_verifications (
      email VARCHAR(255) PRIMARY KEY,
      otp VARCHAR(6) DEFAULT NULL,
      expires_at DATETIME NOT NULL,
      verified TINYINT(1) NOT NULL DEFAULT 0
    ) ENGINE=InnoDB`,
  ];

  let index = 0;

  function runNext() {
    if (index >= queries.length) {
      console.log("All six database tables are ready.");
      return callback(null);
    }

    db.query(queries[index], (err) => {
      if (err) {
        console.error("TABLE CREATION ERROR:", err.message);
        return callback(err);
      }

      index++;
      runNext();
    });
  }

  runNext();
}

function ensureProductImageColumn(callback) {
  db.query("SHOW COLUMNS FROM products LIKE 'image'", (error, columns) => {
    if (error) return callback(error);
    if (!columns || columns.length === 0) {
      return callback(new Error("The products.image column is missing"));
    }

    const currentType = String(columns[0].Type || "").toLowerCase();
    if (currentType.startsWith("mediumtext")) return callback(null);

    db.query("ALTER TABLE products MODIFY COLUMN image MEDIUMTEXT NULL", callback);
  });
}

// =====================================================
// ORDERS TABLE SETUP
// =====================================================

function setupOrdersTable(callback) {
  db.query(
    "SHOW COLUMNS FROM orders",
    (err, columns) => {
      if (err) {
        console.error("ORDERS TABLE CHECK ERROR:", err.message);
        return callback(err);
      }

      const names = columns.map((column) => column.Field);
      const queries = [];

      if (!names.includes("status")) {
        queries.push(`
          ALTER TABLE orders
          ADD COLUMN status VARCHAR(50) DEFAULT 'Processing'
        `);
      }

      if (!names.includes("payment_status")) {
        queries.push(`
          ALTER TABLE orders
          ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Pending'
        `);
      }

      if (!names.includes("current_location")) {
        queries.push(`
          ALTER TABLE orders
          ADD COLUMN current_location VARCHAR(255) DEFAULT 'Warehouse'
        `);
      }

      if (!names.includes("price")) {
        queries.push(`
          ALTER TABLE orders
          ADD COLUMN price DECIMAL(10,2) DEFAULT 0
        `);
      }

      if (!names.includes("total")) {
        queries.push(`
          ALTER TABLE orders
          ADD COLUMN total DECIMAL(10,2) DEFAULT 0
        `);
      }

      function runNext(index) {
        if (index >= queries.length) {
          return setupCategoriesAndInventory();
        }

        db.query(queries[index], (alterErr) => {
          if (alterErr) {
            console.error("ORDERS TABLE ALTER ERROR:", alterErr.message);
            return callback(alterErr);
          }

          runNext(index + 1);
        });
      }

      function setupCategoriesAndInventory() {
        db.query(
          "SHOW COLUMNS FROM categories",
          (catErr, catCols) => {
            if (catErr) return callback(catErr);

            const catNames = catCols.map((c) => c.Field);

            const finishSetup = () => {
              db.query(
                `
                INSERT INTO inventory
                (product_id, quantity, min_stock, updated_at)
                SELECT id, stock, 10, NOW()
                FROM products
                ON DUPLICATE KEY UPDATE
                  quantity = VALUES(quantity)
                `,
                (syncErr) => {
                  if (syncErr) {
                    console.error(
                      "INVENTORY STARTUP SYNC ERROR:",
                      syncErr.message
                    );
                    return callback(syncErr);
                  }

                  console.log("Inventory and products synchronized.");
                  callback(null);
                }
              );
            };

            if (!catNames.includes("description")) {
              db.query(
                `ALTER TABLE categories
                 ADD COLUMN description VARCHAR(255) DEFAULT ''`,
                (altCatErr) => {
                  if (altCatErr) return callback(altCatErr);
                  finishSetup();
                }
              );
            } else {
              finishSetup();
            }
          }
        );
      }

      runNext(0);
    }
  );
}

// =====================================================
// CREATE ORDER - USER
// =====================================================

app.post(
  "/api/orders",
  authenticateToken,
  requireUser,
  (req, res) => {
    const productId = Number((req.body || {}).product_id);
    const quantity = Number((req.body || {}).quantity);
    const paymentStatus = (req.body || {}).payment_status || "Pending";
    const orderStatus = (req.body || {}).order_status || "Processing";

    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive integer" });
    }

    db.getConnection((connectionError, connection) => {
      if (connectionError) {
        console.error("ORDER CONNECTION ERROR:", connectionError.message);
        return res.status(503).json({ message: "Database is temporarily unavailable" });
      }

      const fail = (status, payload) => {
        connection.rollback(() => {
          connection.release();
          if (!res.headersSent) res.status(status).json(payload);
        });
      };

      connection.beginTransaction((transactionError) => {
        if (transactionError) {
          connection.release();
          console.error("TRANSACTION START ERROR:", transactionError.message);
          return res.status(500).json({ message: "Could not initiate order transaction" });
        }

        connection.query(
          "SELECT * FROM products WHERE id = ? FOR UPDATE",
          [productId],
          (productError, products) => {
            if (productError) return fail(500, { message: "Database error while finding product" });
            if (!products || products.length === 0) return fail(404, { message: "Product not found" });

            const product = products[0];
            const stock = Number(product.stock || 0);
            const price = Number(product.price || 0);

            if (stock < quantity) {
              return fail(400, {
                message: "Insufficient product stock",
                availableStock: stock,
                requestedQuantity: quantity,
              });
            }

            const total = price * quantity;
            const insertSql = `
              INSERT INTO orders
              (user_id, product_id, quantity, price, amount, total,
               payment_status, order_status, status, current_location)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
              req.user.id, productId, quantity, price, total, total,
              paymentStatus, orderStatus, orderStatus, "Warehouse",
            ];

            connection.query(insertSql, values, (orderError, orderResult) => {
              if (orderError) return fail(500, { message: "Order could not be created" });

              connection.query(
                "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
                [quantity, productId, quantity],
                (stockError, stockResult) => {
                  if (stockError) return fail(500, { message: "Product stock could not be updated" });
                  if (stockResult.affectedRows === 0) {
                    return fail(400, {
                      message: "Insufficient product stock",
                      availableStock: stock,
                      requestedQuantity: quantity,
                    });
                  }

                  connection.query(
                    "UPDATE inventory SET quantity = GREATEST(0, quantity - ?), updated_at = NOW() WHERE product_id = ?",
                    [quantity, productId],
                    (inventoryError) => {
                      if (inventoryError) return fail(500, { message: "Inventory update failed" });

                      connection.commit((commitError) => {
                        if (commitError) return fail(500, { message: "Transaction commit failed" });

                        connection.release();
                        return res.status(201).json({
                          message: "Order placed successfully",
                          orderId: orderResult.insertId,
                          productName: product.name,
                          remainingStock: stock - quantity,
                        });
                      });
                    }
                  );
                }
              );
            });
          }
        );
      });
    });
  }
);

// =====================================================
// MY ORDERS - USER
// =====================================================

app.get(
  "/api/my-orders",
  authenticateToken,
  requireUser,
  (req, res) => {
    db.query(
      `
      SELECT
        o.id,
        o.user_id,
        o.product_id,
        o.quantity,
        COALESCE(o.amount, o.total, 0) AS amount,
        COALESCE(o.price, p.price, 0) AS price,
        COALESCE(o.order_status, o.status, 'Processing') AS order_status,
        COALESCE(o.payment_status, 'Pending') AS payment_status,
        COALESCE(o.current_location, 'Warehouse') AS current_location,
        o.created_at,
        COALESCE(p.name, CONCAT('Product #', o.product_id)) AS product_name,
        p.image AS product_image,
        p.category AS product_category
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.user_id = ?
      ORDER BY o.id DESC
      `,
      [req.user.id],
      (err, results) => {
        if (err) {
          console.error("MY ORDERS ERROR:", err);

          return res.status(500).json({
            message: "Failed to fetch orders",
            error: err.message,
          });
        }

        res.json(results);
      }
    );
  }
);

// =====================================================
// ALL ORDERS - ADMIN
// =====================================================

app.get(
  "/api/orders",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    db.query(
      `
      SELECT
        o.id,
        o.user_id,
        o.product_id,
        o.quantity,
        COALESCE(o.amount, o.total, 0) AS amount,
        COALESCE(o.price, p.price, 0) AS price,
        COALESCE(o.order_status, o.status, 'Processing') AS order_status,
        COALESCE(o.payment_status, 'Pending') AS payment_status,
        COALESCE(o.current_location, 'Warehouse') AS current_location,
        o.created_at,
        COALESCE(p.name, CONCAT('Product #', o.product_id)) AS product_name,
        p.image AS product_image,
        p.category AS product_category,
        COALESCE(u.name, 'Customer') AS user_name,
        u.email AS user_email,
        u.mobile AS user_phone
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.id DESC
      `,
      (err, results) => {
        if (err) {
          console.error("GET ALL ORDERS ERROR:", err);

          return res.status(500).json({
            message: "Failed to fetch orders",
            error: err.message,
          });
        }

        res.json(results);
      }
    );
  }
);

// =====================================================
// UPDATE ORDER - ADMIN
// =====================================================

app.put(
  "/api/orders/:id",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    const orderId = req.params.id;

    const {
      payment_status,
      order_status,
      current_location,
      status,
    } = req.body || {};

    const finalStatus = order_status || status;

    if (!finalStatus) {
      return res.status(400).json({
        message: "Order status is required",
      });
    }

    const updates = ["status = ?", "order_status = ?"];
    const values = [finalStatus, finalStatus];

    if (payment_status !== undefined) {
      updates.push("payment_status = ?");
      values.push(payment_status);
    }

    if (current_location !== undefined) {
      updates.push("current_location = ?");
      values.push(current_location);
    }

    values.push(orderId);

    const sql = `
      UPDATE orders
      SET ${updates.join(", ")}
      WHERE id = ?
    `;

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("UPDATE ORDER ERROR:", err);

        return res.status(500).json({
          message: "Order could not be updated",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      res.json({
        message: "Order updated successfully",
        orderId,
      });
    });
  }
);

// =====================================================
// DEBUG ORDERS TABLE
// =====================================================

app.get(
  "/api/debug-orders",
  authenticateToken,
  requireAdmin,
  (req, res) => {
    db.query(
      "SHOW COLUMNS FROM orders",
      (err, results) => {
        if (err) {
          return res.status(500).json({
            message: "Could not inspect orders table",
            error: err.message,
          });
        }

        res.json({
          message: "Orders table structure",
          columns: results,
        });
      }
    );
  }
);

// =====================================================
// DASHBOARD - ADMIN
// =====================================================

app.get(
  "/api/dashboard",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const runQuery = (sql, params = []) => {
        return new Promise((resolve, reject) => {
          db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
      };

      // 1. KPI metrics
      const [productStats] = await runQuery(`
        SELECT
          COUNT(*) AS totalProducts,
          COALESCE(SUM(stock), 0) AS totalStock,
          COUNT(CASE WHEN stock <= 10 AND stock > 0 THEN 1 END) AS lowStock,
          COUNT(CASE WHEN stock = 0 THEN 1 END) AS outOfStock
        FROM products
      `);

      const [orderStats] = await runQuery(`
        SELECT
          COUNT(*) AS totalOrders,
          COALESCE(
            SUM(
              CASE
                WHEN payment_status != 'Failed'
                THEN COALESCE(total, amount, 0)
                ELSE 0
              END
            ), 0
          ) AS totalSales,
          COALESCE(
            SUM(
              CASE
                WHEN DATE(created_at) = CURDATE()
                  AND payment_status != 'Failed'
                THEN COALESCE(total, amount, 0)
                ELSE 0
              END
            ), 0
          ) AS todaySales,
          COUNT(
            CASE
              WHEN order_status = 'Pending' OR status = 'Pending'
              THEN 1
            END
          ) AS pendingOrders,
          COUNT(
            CASE
              WHEN order_status = 'Delivered' OR status = 'Delivered'
              THEN 1
            END
          ) AS deliveredOrders
        FROM orders
      `);

      const [categoryStats] = await runQuery(
        "SELECT COUNT(*) AS totalCategories FROM categories"
      );

      const [userStats] = await runQuery(
        "SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'user'"
      );

      // 2. Sales timeline
      const salesTimeline = await runQuery(`
        SELECT
          DATE_FORMAT(created_at, '%b %d') AS date,
          DATE(created_at) AS rawDate,
          COALESCE(
            SUM(
              CASE
                WHEN payment_status != 'Failed'
                THEN COALESCE(total, amount, 0)
                ELSE 0
              END
            ), 0
          ) AS revenue,
          COUNT(*) AS orderCount
        FROM orders
        GROUP BY rawDate, date
        ORDER BY rawDate ASC
        LIMIT 14
      `);

      // 3. Recent orders
      const recentOrders = await runQuery(`
        SELECT
          o.id,
          o.user_id,
          o.product_id,
          o.quantity,
          COALESCE(o.amount, o.total, 0) AS amount,
          COALESCE(o.order_status, o.status, 'Processing') AS order_status,
          COALESCE(o.payment_status, 'Pending') AS payment_status,
          o.created_at,
          COALESCE(p.name, CONCAT('Product #', o.product_id)) AS product_name,
          p.image AS product_image,
          p.category AS product_category,
          COALESCE(u.name, 'Customer') AS user_name,
          u.email AS user_email
        FROM orders o
        LEFT JOIN products p ON o.product_id = p.id
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.id DESC
        LIMIT 8
      `);

      // 4. Top selling products
      const topSellingProducts = await runQuery(`
        SELECT
          p.id,
          p.name,
          p.image,
          p.category,
          p.price,
          p.stock,
          COALESCE(SUM(o.quantity), 0) AS total_sold,
          COALESCE(
            SUM(COALESCE(o.total, o.amount, 0)), 0
          ) AS total_revenue
        FROM products p
        LEFT JOIN orders o
          ON p.id = o.product_id
          AND o.payment_status != 'Failed'
        GROUP BY
          p.id, p.name, p.image, p.category, p.price, p.stock
        ORDER BY total_sold DESC, p.id DESC
        LIMIT 5
      `);

      // 5. Low stock products
      const lowStockProducts = await runQuery(`
        SELECT
          id,
          name,
          category,
          price,
          stock,
          image
        FROM products
        WHERE stock <= 10
        ORDER BY stock ASC
        LIMIT 8
      `);

      // 6. Order status breakdown
      const orderStatusCounts = await runQuery(`
        SELECT
          COALESCE(order_status, status, 'Processing') AS status_name,
          COUNT(*) AS count
        FROM orders
        GROUP BY status_name
      `);

      // 7. Payment status breakdown
      const paymentStatusCounts = await runQuery(`
        SELECT
          COALESCE(payment_status, 'Pending') AS status_name,
          COUNT(*) AS count
        FROM orders
        GROUP BY status_name
      `);

      res.json({
        totalProducts: Number(productStats.totalProducts || 0),
        totalStock: Number(productStats.totalStock || 0),
        lowStock: Number(productStats.lowStock || 0),
        outOfStock: Number(productStats.outOfStock || 0),

        healthyStock: Math.max(
          0,
          Number(productStats.totalProducts || 0) -
          Number(productStats.lowStock || 0) -
          Number(productStats.outOfStock || 0)
        ),

        totalOrders: Number(orderStats.totalOrders || 0),
        totalSales: Number(orderStats.totalSales || 0),
        todaySales: Number(orderStats.todaySales || 0),
        pendingOrders: Number(orderStats.pendingOrders || 0),
        deliveredOrders: Number(orderStats.deliveredOrders || 0),

        totalCategories: Number(categoryStats.totalCategories || 0),
        totalUsers: Number(userStats.totalUsers || 0),

        salesTimeline,
        recentOrders,
        topSellingProducts,
        lowStockProducts,
        orderStatusCounts,
        paymentStatusCounts,
      });
    } catch (error) {
      console.error("DASHBOARD ERROR:", error);

      res.status(500).json({
        message: "Failed to load dashboard data",
        error: error.message,
      });
    }
  }
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(status).json({
      message: err.code === "LIMIT_FILE_SIZE"
        ? "Image must be 2 MB or smaller"
        : "Image upload could not be processed",
    });
  }

  if (err.status && err.status < 500) {
    return res.status(err.status).json({ message: err.message });
  }

  console.error("SERVER ERROR:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    message:
      err.status && err.status < 500
        ? err.message
        : "Internal server error",
  });
});

// =====================================================
// EXPORT EXPRESS APP FOR VERCEL
// =====================================================

// Vercel imports this Express application as a serverless function.
// Do not call app.listen() here.

module.exports = app;
