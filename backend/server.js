// =====================================================
// IMPORTS
// =====================================================

const express = require("express");
const cors = require("cors");
const db = require("./db");
require("dotenv").config();

const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =====================================================
// APP SETUP
// =====================================================

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// =====================================================
// OTP STORAGE
// =====================================================

const otpStore = new Map();
const verifiedEmails = new Set();

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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const emailKey = email.trim().toLowerCase();

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    otpStore.set(emailKey, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

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

    res.json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);

    res.status(500).json({
      message: "Failed to send OTP",
      error: error.message,
    });
  }
});

// =====================================================
// VERIFY OTP
// =====================================================

app.post("/api/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      message: "Email and OTP are required",
    });
  }

  const emailKey = email.trim().toLowerCase();

  const storedData = otpStore.get(emailKey);

  if (!storedData) {
    return res.status(400).json({
      message: "OTP not found or expired",
    });
  }

  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(emailKey);

    return res.status(400).json({
      message: "OTP has expired",
    });
  }

  if (storedData.otp !== otp.toString().trim()) {
    return res.status(400).json({
      message: "Invalid OTP",
    });
  }

  otpStore.delete(emailKey);
  verifiedEmails.add(emailKey);

  console.log("EMAIL VERIFIED:", emailKey);

  res.json({
    message: "Email verified successfully",
  });
});

// =====================================================
// REGISTER USER
// =====================================================

app.post("/api/register", (req, res) => {
  const {
    name,
    email,
    mobile,
    password,
  } = req.body;

  if (!name || !email || !mobile || !password) {
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

  if (!verifiedEmails.has(emailKey)) {
    return res.status(400).json({
      message: "Please verify your email first",
    });
  }

  db.query(
    "SELECT id FROM users WHERE email = ?",
    [emailKey],
    (err, results) => {
      if (err) {
        console.error("CHECK USER ERROR:", err);

        return res.status(500).json({
          message: "Database error while checking user",
          error: err.message,
        });
      }

      if (results.length > 0) {
        return res.status(409).json({
          message:
            "An account with this email already exists",
        });
      }

      const sql =
        "INSERT INTO users (name, email, mobile, password, role) VALUES (?, ?, ?, ?, ?)";

      db.query(
        sql,
        [
          name.trim(),
          emailKey,
          mobile.trim(),
          password,
          "user",
        ],
        (insertErr, result) => {
          if (insertErr) {
            console.error(
              "REGISTER ERROR:",
              insertErr
            );

            return res.status(500).json({
              message: "Account could not be created",
              error: insertErr.message,
              code: insertErr.code,
              sqlMessage: insertErr.sqlMessage,
            });
          }

          verifiedEmails.delete(emailKey);

          console.log(
            "USER REGISTERED:",
            result.insertId
          );

          return res.status(201).json({
            message: "Account created successfully",
            userId: result.insertId,
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
    process.env.JWT_SECRET || "retail_inventory_jwt_secret_key",
    (err, user) => {
      if (err) {
        console.error(
          "JWT ERROR:",
          err.message
        );

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
  if (
    !req.user ||
    req.user.role !== "admin"
  ) {
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
  if (
    !req.user ||
    req.user.role !== "user"
  ) {
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
  const {
    email,
    password,
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const emailKey = email.trim().toLowerCase();

  const sql = `
    SELECT *
    FROM users
    WHERE email = ?
      AND password = ?
  `;

  db.query(
    sql,
    [emailKey, password],
    (err, results) => {
      if (err) {
        console.error("LOGIN ERROR:", err);

        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      const user = results[0];

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET || "retail_inventory_jwt_secret_key",
        {
          expiresIn: "1d",
        }
      );

      res.json({
        message: "Login successful",

        token,

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }
  );
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
          COALESCE(SUM(CASE WHEN o.payment_status != 'Failed' THEN COALESCE(o.total, o.amount, 0) ELSE 0 END), 0) AS total_spent,
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

// Fetch all orders for a specific customer with product and customer details
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

const uploadDir = path.join(
  __dirname,
  "uploads"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
});

app.use(
  "/uploads",
  express.static(uploadDir)
);

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
          console.error(
            "GET PRODUCTS ERROR:",
            err
          );

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
        message:
          "Product name and price are required",
      });
    }

    const image = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const finalStock = Number(
      stock !== undefined ? stock : (quantity || 0)
    );

    const sql = `
      INSERT INTO products
      (
        name,
        category,
        price,
        stock,
        image
      )
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
          console.error(
            "CREATE PRODUCT ERROR:",
            err
          );

          return res.status(500).json({
            message:
              "Failed to create product",
            error: err.message,
          });
        }

        const newProductId = result.insertId;

        // Synchronize inventory table
        db.query(
          `INSERT INTO inventory (product_id, quantity, min_stock, updated_at) 
           VALUES (?, ?, 10, NOW()) 
           ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), updated_at = NOW()`,
          [newProductId, finalStock],
          () => {}
        );

        res.status(201).json({
          message:
            "Product created successfully",
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
      const image =
        `/uploads/${req.file.filename}`;

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

    db.query(
      sql,
      values,
      (err) => {
        if (err) {
          console.error(
            "UPDATE PRODUCT ERROR:",
            err
          );

          return res.status(500).json({
            message:
              "Failed to update product",
            error: err.message,
          });
        }

        // Synchronize inventory table
        db.query(
          `INSERT INTO inventory (product_id, quantity, min_stock, updated_at) 
           VALUES (?, ?, 10, NOW()) 
           ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), updated_at = NOW()`,
          [productId, finalStock],
          () => {}
        );

        res.json({
          message:
            "Product updated successfully",
        });
      }
    );
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

    // 1. Check if product is referenced in historical orders
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
            message: `Cannot delete product because it is linked to ${orderCount} customer order(s). To preserve order records and accounting history, please set its stock to 0 or mark it out of stock instead.`,
            orderCount,
          });
        }

        // 2. Remove inventory record first to satisfy foreign key constraint
        db.query("DELETE FROM inventory WHERE product_id = ?", [productId], (invErr) => {
          if (invErr) {
            console.error("DELETE INVENTORY ON PRODUCT REMOVE ERROR:", invErr);
          }

          // 3. Delete product record
          db.query(
            "DELETE FROM products WHERE id = ?",
            [productId],
            (err) => {
              if (err) {
                console.error(
                  "DELETE PRODUCT ERROR:",
                  err
                );

                return res.status(500).json({
                  message:
                    "Failed to delete product",
                  error: err.message,
                });
              }

              res.json({
                message:
                  "Product deleted successfully",
              });
            }
          );
        });
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
        LEFT JOIN products p ON LOWER(TRIM(c.name)) = LOWER(TRIM(p.category))
        GROUP BY c.id, c.name, c.description
        ORDER BY c.name ASC
      `,
      (err, results) => {
        if (err) {
          console.error("GET CATEGORIES ERROR:", err);
          return res.status(500).json({
            message:
              "Failed to fetch categories",
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
    const {
      name,
      description,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message:
          "Category name is required",
      });
    }

    db.query(
      `
        INSERT INTO categories
        (name, description)
        VALUES (?, ?)
      `,
      [
        name,
        description || "",
      ],
      (err, result) => {
        if (err) {
          return res.status(500).json({
            message:
              "Failed to create category",
            error: err.message,
          });
        }

        res.status(201).json({
          message:
            "Category created successfully",
          categoryId:
            result.insertId,
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
    const {
      name,
      description,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required",
      });
    }

    const newName = name.trim();
    const newDesc = description ? description.trim() : "";

    // 1. Fetch current category name to detect rename
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

        // 2. Update category record
        db.query(
          `
            UPDATE categories
            SET
              name = ?,
              description = ?
            WHERE id = ?
          `,
          [
            newName,
            newDesc,
            categoryId,
          ],
          (updateErr) => {
            if (updateErr) {
              return res.status(500).json({
                message:
                  "Failed to update category",
                error: updateErr.message,
              });
            }

            // 3. If category name changed, cascade update to existing products
            if (oldName.toLowerCase() !== newName.toLowerCase()) {
              db.query(
                "UPDATE products SET category = ? WHERE LOWER(TRIM(category)) = LOWER(TRIM(?))",
                [newName, oldName],
                (prodUpdErr) => {
                  if (prodUpdErr) {
                    console.error("CASCADE CATEGORY UPDATE TO PRODUCTS ERROR:", prodUpdErr);
                  }
                }
              );
            }

            res.json({
              message:
                "Category updated successfully",
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

    // 1. Find category name
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

        // 2. Check if products are currently using this category
        db.query(
          "SELECT COUNT(*) AS count FROM products WHERE LOWER(TRIM(category)) = LOWER(TRIM(?))",
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
                message: `Cannot delete category "${catName}" because it currently has ${count} associated product(s). Please reassign or delete these products first to prevent orphaned records.`,
                productCount: count,
              });
            }

            // 3. Delete category
            db.query(
              "DELETE FROM categories WHERE id = ?",
              [categoryId],
              (err) => {
                if (err) {
                  return res.status(500).json({
                    message:
                      "Failed to delete category",
                    error: err.message,
                  });
                }

                res.json({
                  message:
                    "Category deleted successfully",
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
          console.error(
            "GET INVENTORY ERROR:",
            err
          );

          return res.status(500).json({
            message:
              "Failed to fetch inventory",
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

    if (
      !product_id ||
      quantity === undefined
    ) {
      return res.status(400).json({
        message:
          "Product and quantity are required",
      });
    }

    const qty = Math.max(0, parseInt(quantity, 10) || 0);
    const minStk = min_stock !== undefined ? Math.max(0, parseInt(min_stock, 10) || 0) : 10;

    // Sync products table stock as well
    db.query("UPDATE products SET stock = ? WHERE id = ?", [qty, product_id], () => {});

    db.query(
      `
        INSERT INTO inventory
        (
          product_id,
          warehouse_id,
          quantity,
          min_stock
        )
        VALUES (?, ?, ?, ?)
      `,
      [
        product_id,
        warehouse_id || null,
        qty,
        minStk,
      ],
      (err, result) => {
        if (err) {
          console.error(
            "CREATE INVENTORY ERROR:",
            err
          );

          return res.status(500).json({
            message:
              "Failed to create inventory",
            error: err.message,
          });
        }

        res.status(201).json({
          message:
            "Inventory created successfully",
          inventoryId:
            result.insertId,
        });
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
    const minStk = min_stock !== undefined ? Math.max(0, parseInt(min_stock, 10) || 0) : 10;

    db.query("SELECT product_id FROM inventory WHERE id = ?", [invId], (err, rows) => {
      if (!err && rows && rows.length > 0) {
        db.query("UPDATE products SET stock = ? WHERE id = ?", [newQty, rows[0].product_id], () => {});
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
    });
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
    const minStk = min_stock !== undefined ? Math.max(0, parseInt(min_stock, 10) || 0) : 10;

    // Update product stock
    db.query("UPDATE products SET stock = ? WHERE id = ?", [newStock, productId], (pErr) => {
      if (pErr) {
        console.error("PRODUCT STOCK UPDATE ERROR:", pErr);
        return res.status(500).json({
          message: "Failed to update product stock",
          error: pErr.message,
        });
      }

      // Check if inventory row exists
      db.query("SELECT id FROM inventory WHERE product_id = ?", [productId], (iErr, rows) => {
        if (!iErr && rows && rows.length > 0) {
          db.query(
            "UPDATE inventory SET quantity = ?, min_stock = ?, updated_at = NOW() WHERE product_id = ?",
            [newStock, minStk, productId],
            () => {
              res.json({
                message: "Stock updated successfully",
                productId,
                stock: newStock,
                min_stock: minStk,
              });
            }
          );
        } else {
          db.query(
            "INSERT INTO inventory (product_id, quantity, min_stock, updated_at) VALUES (?, ?, ?, NOW())",
            [productId, newStock, minStk],
            () => {
              res.json({
                message: "Stock updated successfully",
                productId,
                stock: newStock,
                min_stock: minStk,
              });
            }
          );
        }
      });
    });
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
            message:
              "Failed to delete inventory",
            error: err.message,
          });
        }

        res.json({
          message:
            "Inventory deleted successfully",
        });
      }
    );
  }
);

// =====================================================
// ORDERS TABLE SETUP
// =====================================================

function setupOrdersTable(callback) {
  db.query(
    "SHOW COLUMNS FROM orders",
    (err, columns) => {

      if (err) {
        console.error(
          "ORDERS TABLE CHECK ERROR:",
          err.message
        );

        return callback(err);
      }

      const names = columns.map(
        (column) => column.Field
      );

      const queries = [];

      // -------------------------------------------------
      // STATUS
      // -------------------------------------------------

      if (!names.includes("status")) {
        queries.push(`
          ALTER TABLE orders
          ADD COLUMN status VARCHAR(50)
          DEFAULT 'Processing'
        `);
      } else {
        queries.push(`
          ALTER TABLE orders
          MODIFY COLUMN status VARCHAR(50)
          DEFAULT 'Processing'
        `);
      }

      // -------------------------------------------------
      // PAYMENT STATUS
      // -------------------------------------------------

      if (
        !names.includes(
          "payment_status"
        )
      ) {
        queries.push(`
          ALTER TABLE orders
          ADD COLUMN payment_status VARCHAR(50)
          DEFAULT 'Pending'
        `);
      }

      // -------------------------------------------------
      // CURRENT LOCATION
      // -------------------------------------------------

      if (
        !names.includes(
          "current_location"
        )
      ) {
        queries.push(`
          ALTER TABLE orders
          ADD COLUMN current_location VARCHAR(255)
          DEFAULT 'Warehouse'
        `);
      }

      // -------------------------------------------------
      // PRICE
      // -------------------------------------------------

      if (!names.includes("price")) {
        queries.push(`
          ALTER TABLE orders
          ADD COLUMN price DECIMAL(10,2)
          DEFAULT 0
        `);
      }

      // -------------------------------------------------
      // TOTAL
      // -------------------------------------------------

      if (!names.includes("total")) {
        queries.push(`
          ALTER TABLE orders
          ADD COLUMN total DECIMAL(10,2)
          DEFAULT 0
        `);
      }

      // -------------------------------------------------
      // RUN ALTER QUERIES
      // -------------------------------------------------

      function runNext(index) {

        if (index >= queries.length) {
          console.log(
            "Orders table setup completed."
          );

          // Safely check and add description column to categories if not exists
          db.query("SHOW COLUMNS FROM categories", (catErr, catCols) => {
            const finishSetup = () => {
              // Ensure inventory is synchronized with all products
              db.query(
                `INSERT INTO inventory (product_id, quantity, min_stock, updated_at) 
                 SELECT id, stock, 10, NOW() FROM products 
                 ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
                (syncErr) => {
                  if (syncErr) {
                    console.error("INVENTORY STARTUP SYNC ERROR:", syncErr.message);
                  } else {
                    console.log("Inventory and products records synchronized.");
                  }
                  return callback(null);
                }
              );
            };

            if (!catErr && catCols) {
              const catNames = catCols.map((c) => c.Field);
              if (!catNames.includes("description")) {
                db.query(
                  "ALTER TABLE categories ADD COLUMN description VARCHAR(255) DEFAULT ''",
                  (altCatErr) => {
                    if (altCatErr) {
                      console.error("CATEGORIES ALTER ERROR:", altCatErr.message);
                    } else {
                      console.log("Categories description column added.");
                    }
                    return finishSetup();
                  }
                );
                return;
              }
            }
            return finishSetup();
          });
          return;
        }

        db.query(
          queries[index],
          (alterErr) => {

            if (alterErr) {
              console.error(
                "ORDERS TABLE ALTER ERROR:",
                alterErr.message
              );

              return callback(
                alterErr
              );
            }

            runNext(index + 1);
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



    // -------------------------------------------------
    // VALIDATION
  app.post(
  "/api/orders",
  authenticateToken,
  requireUser,
  (req, res) => {
    let {
      product_id,
      quantity,
      payment_status,
      order_status,
    } = req.body;

    product_id = Number(product_id);
    quantity = Number(quantity);

    if (!Number.isInteger(product_id) || product_id <= 0) {
      return res.status(400).json({
        message: "Invalid product ID",
      });
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be a positive integer",
      });
    }

    // -------------------------------------------------
    // START DATABASE TRANSACTION
    // -------------------------------------------------
    db.beginTransaction((trxErr) => {
      if (trxErr) {
        console.error("TRANSACTION START ERROR:", trxErr);
        return res.status(500).json({
          message: "Could not initiate order transaction",
          error: trxErr.message,
        });
      }

      // 1. Lock and lookup product
      db.query(
        "SELECT * FROM products WHERE id = ? FOR UPDATE",
        [product_id],
        (productErr, products) => {
          if (productErr) {
            console.error("GET PRODUCT FOR ORDER ERROR:", productErr);
            return db.rollback(() => {
              res.status(500).json({
                message: "Database error while finding product",
                error: productErr.message,
              });
            });
          }

          if (!products || products.length === 0) {
            return db.rollback(() => {
              res.status(404).json({
                message: "Product not found",
              });
            });
          }

          const product = products[0];

          // Robust stock detection across stock, Stock, quantity
          const productStock = Number(
            product.stock !== undefined
              ? product.stock
              : product.Stock !== undefined
              ? product.Stock
              : product.quantity || 0
          );

          const productPrice = Number(product.price || 0);

          // 2. Strict stock check (do not bypass)
          if (productStock < quantity) {
            return db.rollback(() => {
              res.status(400).json({
                message: "Insufficient product stock",
                availableStock: productStock,
                requestedQuantity: quantity,
              });
            });
          }

          const total = productPrice * quantity;
          const finalPaymentStatus = payment_status || "Pending";
          const finalOrderStatus = order_status || "Processing";

          // 3. Insert Order with both amount and total to satisfy NOT NULL constraints
          const orderSql = `
            INSERT INTO orders
            (
              user_id,
              product_id,
              quantity,
              price,
              amount,
              total,
              payment_status,
              order_status,
              status,
              current_location
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const orderValues = [
            req.user.id,
            product_id,
            quantity,
            productPrice,
            total,
            total,
            finalPaymentStatus,
            finalOrderStatus,
            finalOrderStatus,
            "Warehouse",
          ];

          db.query(orderSql, orderValues, (orderErr, orderResult) => {
            if (orderErr) {
              console.error("CREATE ORDER DATABASE ERROR:", orderErr);
              return db.rollback(() => {
                res.status(500).json({
                  message: "Order could not be created",
                  error: orderErr.message,
                });
              });
            }

            const orderId = orderResult.insertId;

            // 4. Atomically deduct stock from products table
            db.query(
              `
                UPDATE products
                SET stock = stock - ?
                WHERE id = ? AND stock >= ?
              `,
              [quantity, product_id, quantity],
              (updateErr, updateResult) => {
                if (updateErr || updateResult.affectedRows === 0) {
                  console.error("STOCK UPDATE ERROR:", updateErr);
                  return db.rollback(() => {
                    res.status(400).json({
                      message: "Insufficient product stock",
                      availableStock: productStock,
                      requestedQuantity: quantity,
                    });
                  });
                }

                // 5. Also sync inventory table if a record exists for this product
                db.query(
                  `
                    UPDATE inventory
                    SET quantity = GREATEST(0, quantity - ?)
                    WHERE product_id = ?
                  `,
                  [quantity, product_id],
                  () => {
                    // 6. Commit transaction
                    db.commit((commitErr) => {
                      if (commitErr) {
                        console.error("COMMIT ERROR:", commitErr);
                        return db.rollback(() => {
                          res.status(500).json({
                            message: "Transaction commit failed",
                            error: commitErr.message,
                          });
                        });
                      }

                      console.log("ORDER CREATED & STOCK DEDUCTED:", orderId);

                      return res.status(201).json({
                        message: "Order placed successfully",
                        orderId: orderId,
                        productName: product.name,
                        remainingStock: productStock - quantity,
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

    const orderId =
      req.params.id;

    const {
      payment_status,
      order_status,
      current_location,
      status,
    } = req.body;

    console.log("");
    console.log(
      "================================="
    );
    console.log(
      "UPDATE ORDER REQUEST"
    );
    console.log(
      "Order ID:",
      orderId
    );
    console.log(
      "Payment Status:",
      payment_status
    );
    console.log(
      "Order Status:",
      order_status
    );
    console.log(
      "Location:",
      current_location
    );
    console.log(
      "================================="
    );

    const finalStatus =
      order_status || status;

    if (!finalStatus) {
      return res.status(400).json({
        message:
          "Order status is required",
      });
    }

    db.query(
      "SHOW COLUMNS FROM orders",
      (columnErr, columns) => {

        if (columnErr) {
          console.error(
            "SHOW ORDER COLUMNS ERROR:",
            columnErr
          );

          return res.status(500).json({
            message:
              "Could not inspect orders table",
            error:
              columnErr.message,
          });
        }

        const columnNames =
          columns.map(
            (column) =>
              column.Field
          );

        console.log(
          "ORDER TABLE COLUMNS:",
          columnNames
        );

        const updates = [];
        const values = [];

        // -------------------------------------------------
        // ORDER STATUS
        // -------------------------------------------------

        if (
          columnNames.includes(
            "status"
          )
        ) {
          updates.push(
            "status = ?"
          );

          values.push(
            finalStatus
          );
        }

        // -------------------------------------------------
        // ORDER STATUS FALLBACK
        // -------------------------------------------------

        else if (
          columnNames.includes(
            "order_status"
          )
        ) {
          updates.push(
            "order_status = ?"
          );

          values.push(
            finalStatus
          );
        }

        // -------------------------------------------------
        // PAYMENT STATUS
        // -------------------------------------------------

        if (
          columnNames.includes(
            "payment_status"
          ) &&
          payment_status !==
            undefined
        ) {
          updates.push(
            "payment_status = ?"
          );

          values.push(
            payment_status
          );
        }

        // -------------------------------------------------
        // CURRENT LOCATION
        // -------------------------------------------------

        if (
          columnNames.includes(
            "current_location"
          ) &&
          current_location !==
            undefined
        ) {
          updates.push(
            "current_location = ?"
          );

          values.push(
            current_location
          );
        }

        if (
          updates.length === 0
        ) {
          return res.status(400).json({
            message:
              "No order fields available to update",
          });
        }

        values.push(
          orderId
        );

        const sql = `
          UPDATE orders
          SET ${updates.join(", ")}
          WHERE id = ?
        `;

        console.log(
          "UPDATE ORDER SQL:"
        );

        console.log(sql);

        console.log(
          "UPDATE VALUES:",
          values
        );

        db.query(
          sql,
          values,
          (
            err,
            result
          ) => {

            if (err) {
              console.error("");
              console.error(
                "================================="
              );
              console.error(
                "UPDATE ORDER DATABASE ERROR"
              );
              console.error(
                "Message:",
                err.message
              );
              console.error(
                "Code:",
                err.code
              );
              console.error(
                "SQL Message:",
                err.sqlMessage
              );
              console.error(
                "================================="
              );

              return res.status(500).json({
                message:
                  "Order could not be updated",
                error:
                  err.message,
                code:
                  err.code,
                sqlMessage:
                  err.sqlMessage,
              });
            }

            console.log(
              "ORDER UPDATED SUCCESSFULLY"
            );

            console.log(
              "Affected rows:",
              result.affectedRows
            );

            res.json({
              message:
                "Order updated successfully",
              orderId:
                orderId,
            });
          }
        );
      }
    );
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
            message:
              "Could not inspect orders table",
            error:
              err.message,
          });
        }

        res.json({
          message:
            "Orders table structure",
          columns:
            results,
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
          COALESCE(SUM(CASE WHEN payment_status != 'Failed' THEN COALESCE(total, amount, 0) ELSE 0 END), 0) AS totalSales,
          COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() AND payment_status != 'Failed' THEN COALESCE(total, amount, 0) ELSE 0 END), 0) AS todaySales,
          COUNT(CASE WHEN order_status = 'Pending' OR status = 'Pending' THEN 1 END) AS pendingOrders,
          COUNT(CASE WHEN order_status = 'Delivered' OR status = 'Delivered' THEN 1 END) AS deliveredOrders
        FROM orders
      `);

      const [categoryStats] = await runQuery("SELECT COUNT(*) AS totalCategories FROM categories");
      const [userStats] = await runQuery("SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'user'");

      // 2. Sales Timeline (by date from real orders)
      const salesTimeline = await runQuery(`
        SELECT 
          DATE_FORMAT(created_at, '%b %d') AS date,
          DATE(created_at) AS rawDate,
          COALESCE(SUM(CASE WHEN payment_status != 'Failed' THEN COALESCE(total, amount, 0) ELSE 0 END), 0) AS revenue,
          COUNT(*) AS orderCount
        FROM orders
        GROUP BY rawDate, date
        ORDER BY rawDate ASC
        LIMIT 14
      `);

      // 3. Recent Orders
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

      // 4. Top Selling Products
      const topSellingProducts = await runQuery(`
        SELECT
          p.id,
          p.name,
          p.image,
          p.category,
          p.price,
          p.stock,
          COALESCE(SUM(o.quantity), 0) AS total_sold,
          COALESCE(SUM(COALESCE(o.total, o.amount, 0)), 0) AS total_revenue
        FROM products p
        LEFT JOIN orders o ON p.id = o.product_id AND o.payment_status != 'Failed'
        GROUP BY p.id, p.name, p.image, p.category, p.price, p.stock
        ORDER BY total_sold DESC, p.id DESC
        LIMIT 5
      `);

      // 5. Low Stock Products (stock <= 10)
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

      // 6. Order Status breakdown
      const orderStatusCounts = await runQuery(`
        SELECT 
          COALESCE(order_status, status, 'Processing') AS status_name,
          COUNT(*) AS count
        FROM orders
        GROUP BY status_name
      `);

      // 7. Payment Status breakdown
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
        healthyStock: Math.max(0, Number(productStats.totalProducts || 0) - Number(productStats.lowStock || 0) - Number(productStats.outOfStock || 0)),

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
// ERROR HANDLER
// =====================================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {

    console.error(
      "SERVER ERROR:",
      err
    );

    res.status(500).json({
      message:
        "Internal server error",
      error:
        err.message,
    });
  }
);

// =====================================================
// START SERVER
// =====================================================

setupOrdersTable(
  (setupError) => {

    if (setupError) {
      console.error(
        "WARNING: Orders table setup failed."
      );

      console.error(
        setupError.message
      );
    }

    app.listen(
      PORT,
      () => {

        console.log(
          "================================="
        );

        console.log(
          `Server running on port ${PORT}`
        );

        console.log(
          "================================="
        );
      }
    );
  }
);

module.exports = app;