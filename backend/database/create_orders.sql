-- LUMIQ commerce tables, matching the schema in the supplied lumiq.sql dump.
-- Select database `lumiq` in phpMyAdmin before running this file.
-- Creates tables only; does not run Laravel migrations or insert sample data.
-- Do not run this to update existing tables: CREATE TABLE IF NOT EXISTS is not an upgrade.

CREATE TABLE IF NOT EXISTS `promotions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(40) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `discount_percent` DECIMAL(5, 2) NOT NULL,
    `minimum_subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `per_customer_limit` INT UNSIGNED NOT NULL DEFAULT 1,
    `starts_at` DATETIME NOT NULL,
    `ends_at` DATETIME NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_promotions_code` (`code`),
    KEY `idx_promotions_active_dates` (`is_active`, `starts_at`, `ends_at`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_code` VARCHAR(40) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `customer_name` VARCHAR(100) NOT NULL,
    `customer_email` VARCHAR(191) NOT NULL,
    `customer_phone` VARCHAR(15) NOT NULL,
    `shipping_address` TEXT NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `shipping_fee` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `shipping_distance_meters` INT UNSIGNED NULL,
    `discount_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `status` ENUM(
        'pending',
        'processing',
        'shipped',
        'completed',
        'cancelled'
    ) NOT NULL DEFAULT 'pending',
    `stock_restored_at` DATETIME NULL,
    `customer_note` TEXT NULL,
    `admin_note` TEXT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `orders_order_code_unique` (`order_code`),
    KEY `orders_user_id_created_at_index` (`user_id`, `created_at`),
    KEY `orders_status_created_at_index` (`status`, `created_at`),
    KEY `orders_created_at_index` (`created_at`),

    CONSTRAINT `orders_user_id_foreign`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NULL,
    `product_variant_id` BIGINT UNSIGNED NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `size` VARCHAR(20) NULL,
    `color` VARCHAR(50) NULL,
    `unit_price` DECIMAL(12, 2) NOT NULL,
    `quantity` INT UNSIGNED NOT NULL,
    `line_total` DECIMAL(12, 2) NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    KEY `order_items_order_id_index` (`order_id`),
    KEY `order_items_product_id_index` (`product_id`),
    KEY `order_items_product_variant_id_index` (`product_variant_id`),

    CONSTRAINT `order_items_order_id_foreign`
        FOREIGN KEY (`order_id`)
        REFERENCES `orders` (`id`)
        ON DELETE CASCADE,
    CONSTRAINT `order_items_product_id_foreign`
        FOREIGN KEY (`product_id`)
        REFERENCES `products` (`id`)
        ON DELETE SET NULL,
    CONSTRAINT `order_items_product_variant_id_foreign`
        FOREIGN KEY (`product_variant_id`)
        REFERENCES `product_variants` (`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_status_histories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `changed_by_user_id` BIGINT UNSIGNED NULL,
    `old_status` ENUM(
        'pending',
        'processing',
        'shipped',
        'completed',
        'cancelled'
    ) NULL,
    `new_status` ENUM(
        'pending',
        'processing',
        'shipped',
        'completed',
        'cancelled'
    ) NOT NULL,
    `note` TEXT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    KEY `order_status_histories_order_id_created_at_index` (`order_id`, `created_at`),
    KEY `order_status_histories_changed_by_user_id_index` (`changed_by_user_id`),

    CONSTRAINT `order_status_histories_order_id_foreign`
        FOREIGN KEY (`order_id`)
        REFERENCES `orders` (`id`)
        ON DELETE CASCADE,
    CONSTRAINT `order_status_histories_changed_by_user_id_foreign`
        FOREIGN KEY (`changed_by_user_id`)
        REFERENCES `users` (`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `method` ENUM('cod', 'bank_transfer') NOT NULL,
    `status` ENUM(
        'unpaid',
        'pending_verification',
        'paid',
        'refund_pending',
        'refunded'
    ) NOT NULL DEFAULT 'unpaid',
    `transaction_reference` VARCHAR(100) NULL,
    `confirmed_by_user_id` BIGINT UNSIGNED NULL,
    `paid_at` DATETIME NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_payments_order` (`order_id`),
    KEY `idx_payments_status` (`status`),
    KEY `fk_payments_confirmed_by` (`confirmed_by_user_id`),

    CONSTRAINT `fk_payments_order`
        FOREIGN KEY (`order_id`)
        REFERENCES `orders` (`id`)
        ON DELETE RESTRICT,
    CONSTRAINT `fk_payments_confirmed_by`
        FOREIGN KEY (`confirmed_by_user_id`)
        REFERENCES `users` (`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `invoices` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `invoice_number` VARCHAR(40) NOT NULL,
    `document_type` ENUM('receipt', 'final') NOT NULL,
    `issued_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_invoice_number` (`invoice_number`),
    UNIQUE KEY `uq_invoice_order_type` (`order_id`, `document_type`),

    CONSTRAINT `fk_invoices_order`
        FOREIGN KEY (`order_id`)
        REFERENCES `orders` (`id`)
        ON DELETE RESTRICT
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `promotion_redemptions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `promotion_id` BIGINT UNSIGNED NULL,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `code` VARCHAR(40) NOT NULL,
    `discount_amount` DECIMAL(12, 2) NOT NULL,
    `reversed_at` DATETIME NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,

    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_redemptions_order` (`order_id`),
    KEY `idx_redemptions_customer_limit` (`promotion_id`, `user_id`, `reversed_at`),
    KEY `fk_redemptions_user` (`user_id`),

    CONSTRAINT `fk_redemptions_order`
        FOREIGN KEY (`order_id`)
        REFERENCES `orders` (`id`)
        ON DELETE RESTRICT,
    CONSTRAINT `fk_redemptions_promotion`
        FOREIGN KEY (`promotion_id`)
        REFERENCES `promotions` (`id`)
        ON DELETE SET NULL,
    CONSTRAINT `fk_redemptions_user`
        FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`)
        ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
