-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Nov 01, 2026 at 01:03 PM
-- Server version: 8.4.7
-- PHP Version: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lumiq`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
CREATE TABLE IF NOT EXISTS `categories` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `sort_order` int UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_slug` (`slug`),
  KEY `idx_categories_status_order` (`status`,`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'Áo Thun', 'ao-thun', 'active', 0, '2026-10-23 07:47:43', '2026-10-23 07:47:43'),
(2, 'Áo Sơ Mi', 'ao-so-mi', 'active', 0, '2026-10-23 07:47:52', '2026-10-23 07:47:52'),
(3, 'Quần', 'quan', 'active', 0, '2026-10-23 07:47:58', '2026-10-23 07:47:58'),
(4, 'Phụ kiện', 'phu-kien', 'active', 3, '2026-10-26 09:41:42', '2026-10-26 09:41:42');

-- --------------------------------------------------------

--
-- Table structure for table `email_otps`
--

DROP TABLE IF EXISTS `email_otps`;
CREATE TABLE IF NOT EXISTS `email_otps` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `otp_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose` enum('register','forgot_password') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint UNSIGNED NOT NULL DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_otp_user_purpose` (`user_id`,`purpose`)
) ENGINE=InnoDB AUTO_INCREMENT=280 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_otps`
--

INSERT INTO `email_otps` (`id`, `user_id`, `otp_hash`, `purpose`, `attempts`, `expires_at`, `used_at`, `created_at`, `updated_at`) VALUES
(226, 284, '$2y$12$h0e0c1fx/0rtdSpjMtV.0etkTv9HUT2MWPVbRvyFJyI.LRsrqukhW', 'register', 0, '2026-10-31 15:20:42', '2026-10-31 15:16:11', '2026-10-31 08:15:42', '2026-10-31 08:16:11'),
(227, 284, '$2y$12$2xt4i9zVLXO3ReSrEuRHae/mce5EsoWyNn8mN84CI7zwbih2jtAcu', 'forgot_password', 0, '2026-10-31 15:21:46', '2026-10-31 15:17:06', '2026-10-31 08:16:46', '2026-10-31 08:17:06'),
(245, 307, '$2y$12$32WR5y/1fDhDcKf7AIajW.WSZd.eRw4ZzpsJwlLZ1.4yjlodg88VS', 'register', 0, '2026-10-31 16:44:43', '2026-10-31 16:40:05', '2026-10-31 09:39:43', '2026-10-31 09:40:05');

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint UNSIGNED NOT NULL,
  `invoice_number` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type` enum('receipt','final') COLLATE utf8mb4_unicode_ci NOT NULL,
  `issued_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invoice_number` (`invoice_number`),
  UNIQUE KEY `uq_invoice_order_type` (`order_id`,`document_type`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `order_id`, `invoice_number`, `document_type`, `issued_at`) VALUES
(1, 35, 'LQ-R-00000035', 'receipt', '2026-10-31 16:37:32'),
(2, 35, 'LQ-F-00000035', 'final', '2026-10-31 16:47:37');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
CREATE TABLE IF NOT EXISTS `orders` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `customer_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_phone` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `shipping_address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `shipping_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `shipping_distance_meters` int UNSIGNED DEFAULT NULL,
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('pending','processing','shipped','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `stock_restored_at` datetime DEFAULT NULL,
  `customer_note` text COLLATE utf8mb4_unicode_ci,
  `admin_note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_code_unique` (`order_code`),
  KEY `orders_user_id_created_at_index` (`user_id`,`created_at`),
  KEY `orders_status_created_at_index` (`status`,`created_at`),
  KEY `orders_created_at_index` (`created_at`)
) ;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_code`, `user_id`, `customer_name`, `customer_email`, `customer_phone`, `shipping_address`, `subtotal`, `shipping_fee`, `shipping_distance_meters`, `discount_amount`, `total`, `status`, `stock_restored_at`, `customer_note`, `admin_note`, `created_at`, `updated_at`) VALUES
(35, 'LQ-261031-636D9E45', 284, 'Bích Võ', 'bichvt2307@gmail.com', '0395463733', '180 cao lỗ, phường chánh hưng , hồ chí minh | Vị trí giao: 10.7379821, 106.6779264', 936000.00, 10000.00, 1406, 0.00, 946000.00, 'completed', NULL, NULL, NULL, '2026-10-31 09:37:32', '2026-10-31 09:47:37');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint UNSIGNED NOT NULL,
  `product_id` bigint UNSIGNED DEFAULT NULL,
  `product_variant_id` bigint UNSIGNED DEFAULT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `quantity` int UNSIGNED NOT NULL,
  `line_total` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_index` (`order_id`),
  KEY `order_items_product_id_index` (`product_id`),
  KEY `order_items_product_variant_id_index` (`product_variant_id`)
) ;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_variant_id`, `product_name`, `sku`, `size`, `color`, `unit_price`, `quantity`, `line_total`, `created_at`, `updated_at`) VALUES
(1, 35, 66, 258, 'Áo thun phong cảnh trăng đen', 'LVTN-60-1-M', 'M', 'Đen', 179000.00, 1, 179000.00, '2026-10-31 09:37:32', '2026-10-31 09:37:32'),
(2, 35, 67, 294, 'Áo sơ mi Beach Club xanh hoa nhí', 'LVTN-61-1-M', 'M', 'Xanh lá nhạt', 289000.00, 1, 289000.00, '2026-10-31 09:37:32', '2026-10-31 09:37:32'),
(3, 35, 67, 297, 'Áo sơ mi Beach Club xanh hoa nhí', 'LVTN-T', 'S', 'Trắng', 289000.00, 1, 289000.00, '2026-10-31 09:37:32', '2026-10-31 09:37:32'),
(4, 35, 66, 260, 'Áo thun phong cảnh trăng đen', 'LVTN-60-1-XL', 'XL', 'Đen', 179000.00, 1, 179000.00, '2026-10-31 09:37:32', '2026-10-31 09:37:32');

-- --------------------------------------------------------

--
-- Table structure for table `order_status_histories`
--

DROP TABLE IF EXISTS `order_status_histories`;
CREATE TABLE IF NOT EXISTS `order_status_histories` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint UNSIGNED NOT NULL,
  `changed_by_user_id` bigint UNSIGNED DEFAULT NULL,
  `old_status` enum('pending','processing','shipped','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` enum('pending','processing','shipped','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_status_histories_order_id_created_at_index` (`order_id`,`created_at`),
  KEY `order_status_histories_changed_by_user_id_index` (`changed_by_user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_status_histories`
--

INSERT INTO `order_status_histories` (`id`, `order_id`, `changed_by_user_id`, `old_status`, `new_status`, `note`, `created_at`) VALUES
(1, 35, 284, NULL, 'pending', 'Khách hàng vừa đặt đơn COD.', '2026-10-31 09:37:32'),
(2, 35, 307, 'pending', 'processing', NULL, '2026-10-31 09:47:21'),
(3, 35, 307, 'processing', 'shipped', NULL, '2026-10-31 09:47:33'),
(4, 35, 307, 'shipped', 'completed', NULL, '2026-10-31 09:47:37');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
CREATE TABLE IF NOT EXISTS `payments` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` bigint UNSIGNED NOT NULL,
  `method` enum('cod','bank_transfer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('unpaid','pending_verification','paid','refund_pending','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `transaction_reference` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confirmed_by_user_id` bigint UNSIGNED DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payments_order` (`order_id`),
  KEY `idx_payments_status` (`status`),
  KEY `fk_payments_confirmed_by` (`confirmed_by_user_id`)
) ;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `method`, `status`, `transaction_reference`, `confirmed_by_user_id`, `paid_at`, `created_at`, `updated_at`) VALUES
(14, 35, 'cod', 'paid', 'AAAA', 307, '2026-10-31 16:41:31', '2026-10-31 09:37:32', '2026-10-31 09:43:12');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
CREATE TABLE IF NOT EXISTS `products` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` bigint UNSIGNED DEFAULT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `price` decimal(12,2) NOT NULL,
  `has_size` tinyint(1) NOT NULL DEFAULT '0',
  `has_color` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('active','inactive') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_products_category` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `category_id`, `name`, `description`, `price`, `has_size`, `has_color`, `status`, `created_at`, `updated_at`) VALUES
(7, 1, 'Áo thun Beach Time trắng', 'Hình ô che nắng, mặt trời vàng và sóng biển nhỏ lệch ngực. Dễ kết hợp trong trang phục hằng ngày.', 120000.00, 1, 1, 'active', '2026-10-26 09:34:37', '2026-10-26 09:41:43'),
(8, 1, 'Áo thun LUMIQ Monogram trắng', 'Logo LUMIQ lớn màu đen ở giữa ngực, cổ tròn và tay ngắn. Dễ kết hợp trong trang phục hằng ngày.', 149000.00, 1, 1, 'active', '2026-10-26 09:41:42', '2026-10-26 09:41:42'),
(9, 1, 'Áo thun Thỏ Pudding đỏ in ngực nhỏ', 'Hình thỏ trắng bên bánh pudding nhỏ lệch ngực, nền áo đỏ. Dễ kết hợp trong trang phục hằng ngày.', 159000.00, 1, 1, 'active', '2026-10-26 09:41:42', '2026-10-26 09:41:42'),
(10, 1, 'Áo thun Thỏ Pudding mint in ngực nhỏ', 'Hình thỏ trắng và bánh pudding nhỏ trên nền xanh mint, cổ tròn tay ngắn. Dễ kết hợp trong trang phục hằng ngày.', 159000.00, 1, 1, 'active', '2026-10-26 09:41:42', '2026-10-26 09:41:42'),
(11, 2, 'Áo sơ mi LUMIQ đen tay ngắn', 'Cổ bẻ, hàng nút phía trước và logo LUMIQ nhỏ trên ngực. Dễ kết hợp trong trang phục hằng ngày.', 259000.00, 1, 1, 'active', '2026-10-26 09:41:42', '2026-10-26 09:41:42'),
(12, 1, 'Áo thun Sunny Escape trắng', 'Họa tiết đồ uống, trái cây và hoa nhiệt đới nhiều màu in lớn phía trước. Dễ kết hợp trong trang phục hằng ngày.', 179000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(13, 1, 'Áo thun Thỏ Pudding đỏ hình lớn', 'Hình thỏ trắng và bánh pudding lớn giữa ngực, cổ tròn tay ngắn. Dễ kết hợp trong trang phục hằng ngày.', 169000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(14, 2, 'Áo sơ mi LUMIQ sọc xanh trắng', 'Sọc dọc xanh nhạt và trắng, logo LUMIQ phía trước, cổ bẻ tay ngắn. Dễ kết hợp trong trang phục hằng ngày.', 269000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(15, 1, 'Áo thun Beach Club trắng hình lớn', 'Họa tiết cây dừa và bãi biển nhiều màu in lớn giữa ngực. Dễ kết hợp trong trang phục hằng ngày.', 179000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(16, 1, 'Áo thun Beach Club trắng in ngực nhỏ', 'Họa tiết bãi biển nhỏ lệch ngực trên nền trắng, cổ tròn tay ngắn. Dễ kết hợp trong trang phục hằng ngày.', 159000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(17, 1, 'Áo thun Thỏ Pudding vàng kem', 'Hình thỏ trắng và bánh pudding lớn trên nền vàng kem. Dễ kết hợp trong trang phục hằng ngày.', 169000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(18, 1, 'Áo thun LUMIQ be in ngực nhỏ', 'Logo LUMIQ nhỏ lệch ngực, nền be trơn, cổ tròn tay ngắn. Dễ kết hợp trong trang phục hằng ngày.', 149000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(19, 2, 'Áo sơ mi Thỏ Pudding xanh hoa nhí', 'Nền xanh hoa nhí kết hợp hình thỏ và bánh pudding lớn phía trước. Dễ kết hợp trong trang phục hằng ngày.', 279000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(20, 1, 'Áo thun LUMIQ Classic trắng', 'Logo LUMIQ đen ở giữa ngực, dáng suông cổ tròn tay ngắn. Dễ kết hợp trong trang phục hằng ngày.', 149000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(21, 1, 'Áo thun Thỏ Pudding Beach Time navy', 'Hình thỏ và bánh pudding kết hợp họa tiết ô che nắng, sóng biển hai bên ngực. Dễ kết hợp trong trang phục hằng ngày.', 179000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(22, 1, 'Áo thun LUMIQ Sea Breeze trắng', 'Logo LUMIQ kết hợp hình vỏ sò, sao biển và sóng nhỏ ở ngực. Dễ kết hợp trong trang phục hằng ngày.', 159000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(23, 2, 'Áo sơ mi LUMIQ đỏ tay ngắn', 'Cổ bẻ, hàng nút trước và logo LUMIQ nhỏ trên ngực áo đỏ. Dễ kết hợp trong trang phục hằng ngày.', 259000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(24, 2, 'Áo sơ mi xanh hoa nhí', 'Hoa nhỏ rải trên nền xanh nhạt, cổ bẻ và tay ngắn. Dễ kết hợp trong trang phục hằng ngày.', 239000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(25, 2, 'Áo sơ mi lá dừa nhiệt đới', 'Họa tiết cây dừa và lá nhiệt đới xanh trên nền trắng, tay ngắn. Dễ kết hợp trong trang phục hằng ngày.', 249000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(26, 2, 'Áo sơ mi sọc xanh trắng', 'Sọc dọc xanh nhạt và trắng, cổ bẻ, hàng nút phía trước. Dễ kết hợp trong trang phục hằng ngày.', 239000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(27, 2, 'Áo sơ mi họa tiết chanh vàng', 'Họa tiết quả chanh vàng và lá xanh trên nền trắng kem. Dễ kết hợp trong trang phục hằng ngày.', 249000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(28, 2, 'Áo sơ mi sóng biển hoàng hôn', 'Mảng sóng xanh ngọc cùng mặt trời cam trên nền be, cổ mở tay ngắn. Dễ kết hợp trong trang phục hằng ngày.', 259000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(29, 1, 'Áo thun Sunny Vibes trắng', 'Hình mặt trời cam, cây dừa và sóng nhỏ lệch ngực. Dễ kết hợp trong trang phục hằng ngày.', 149000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(30, 1, 'Áo thun Island Mood trắng', 'Họa tiết cây dừa, mặt trời vàng và sóng xanh nhỏ lệch ngực. Dễ kết hợp trong trang phục hằng ngày.', 149000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(31, 1, 'Áo thun Sea Breeze trắng', 'Hình vỏ sò hồng, sao biển và sóng xanh nhỏ lệch ngực. Dễ kết hợp trong trang phục hằng ngày.', 149000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(32, 1, 'Áo thun Lemon Day trắng', 'Họa tiết quả chanh vàng và lá xanh nhỏ lệch ngực. Dễ kết hợp trong trang phục hằng ngày.', 149000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(33, 4, 'Túi xách mini kem họa tiết dễ thương', 'Túi có quai xách đôi, hình trang trí nhỏ phía trước; ảnh thể hiện nhiều mẫu họa tiết.', 129000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(35, 3, 'Quần short lá nhiệt đới cam xanh', 'Quần short lưng chun, họa tiết lá xanh và cam trên nền sáng. Dễ kết hợp trong trang phục hằng ngày.', 179000.00, 1, 1, 'active', '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(37, 4, 'Kính mát gọng vuông nhiều màu', 'Kính mát gọng vuông với nhiều phối màu như ảnh, phù hợp phối đồ dạo phố.', 99000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(40, 4, 'Dép quai ngang hoa dâm bụt hồng', 'Dép đế hồng, quai ngang trắng kem in hoa hồng và lá xanh.', 129000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(41, 4, 'Kính mát gọng xanh ngọc', 'Gọng xanh ngọc trong và tròng xanh nhạt, dáng mắt kính bo góc.', 119000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(42, 4, 'Túi đan màu tự nhiên kèm khăn', 'Túi quai tròn có bề mặt đan, điểm nhấn khăn xanh nhạt buộc ở quai.', 249000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(43, 4, 'Mũ bucket họa tiết chanh', 'Mũ vành tròn, nền trắng kem in quả chanh vàng và lá xanh.', 129000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(44, 4, 'Túi tote Good Days Ahead', 'Túi quai dài màu kem in cây dừa, mặt trời và sóng biển phía trước.', 149000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(45, 3, 'Quần short xanh hoa nhí', 'Quần short lưng chun dây rút, hoa nhỏ rải trên nền xanh nhạt. Dễ kết hợp trong trang phục hằng ngày.', 179000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(46, 3, 'Quần short lá nhiệt đới xanh', 'Quần short nền trắng in lá nhiệt đới xanh, lưng chun và dây rút. Dễ kết hợp trong trang phục hằng ngày.', 189000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(47, 3, 'Quần short sọc xanh trắng', 'Quần short sọc dọc xanh trắng, lưng chun và dây rút sáng màu. Dễ kết hợp trong trang phục hằng ngày.', 179000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(48, 3, 'Quần short họa tiết chanh vàng', 'Quần short lưng chun dây rút, họa tiết chanh vàng và lá xanh. Dễ kết hợp trong trang phục hằng ngày.', 189000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(49, 3, 'Quần short sóng biển hoàng hôn', 'Quần short in sóng xanh ngọc, mặt trời cam và chim trên nền be. Dễ kết hợp trong trang phục hằng ngày.', 199000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(50, 1, 'Áo thun trắng cổ tròn essential', 'Áo trắng trơn cổ tròn tay ngắn, phom đơn giản dễ phối đồ. Dễ kết hợp trong trang phục hằng ngày.', 109000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(51, 1, 'Áo thun Sunny Escape navy hình lớn', 'Họa tiết trái cây, hoa nhiệt đới và chữ HELLO lớn phía trước. Dễ kết hợp trong trang phục hằng ngày.', 179000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(52, 1, 'Áo thun Sunny Escape navy in ngực nhỏ', 'Họa tiết nhiệt đới nhiều màu nhỏ lệch ngực trên nền xanh navy. Dễ kết hợp trong trang phục hằng ngày.', 159000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(53, 1, 'Áo thun Good Vibes be in ngực nhỏ', 'Họa tiết ván lướt sóng và cây nhiệt đới nhỏ lệch ngực. Dễ kết hợp trong trang phục hằng ngày.', 159000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(54, 1, 'Áo thun Good Vibes đen hình lớn', 'Họa tiết ba ván lướt sóng, lá nhiệt đới và chữ Good Vibes lớn phía trước. Dễ kết hợp trong trang phục hằng ngày.', 179000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(55, 1, 'Áo thun phong cảnh trăng trắng', 'Khung hình phong cảnh xanh đen với cây, mặt nước và ánh trăng ở ngực. Dễ kết hợp trong trang phục hằng ngày.', 179000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(56, 1, 'Áo thun Sunny Escape đỏ', 'Họa tiết mặt trời và hoa lá nhiệt đới nhỏ lệch ngực trên nền đỏ. Dễ kết hợp trong trang phục hằng ngày.', 159000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(57, 1, 'Áo thun Sunny Escape đen', 'Họa tiết mặt trời và hoa lá nhiệt đới lệch ngực trên nền đen. Dễ kết hợp trong trang phục hằng ngày.', 159000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(58, 1, 'Áo thun Hello Summer đen', 'Họa tiết nhiệt đới nhỏ kèm chữ HELLO ở ngực trên nền đen. Dễ kết hợp trong trang phục hằng ngày.', 159000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(59, 2, 'Áo sơ mi Ocean Breeze mint', 'Hình rùa biển, sóng nước và hoa nhiệt đới lớn trên nền xanh mint. Dễ kết hợp trong trang phục hằng ngày.', 289000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(60, 2, 'Áo sơ mi Ocean Breeze trắng', 'Hình rùa biển, hoa nhiệt đới và chữ Ocean Breeze lớn trên nền trắng. Dễ kết hợp trong trang phục hằng ngày.', 289000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(61, 2, 'Áo sơ mi Ocean Breeze toàn họa tiết', 'Họa tiết rùa biển, sóng nước và hoa nhiệt đới phủ khắp áo. Dễ kết hợp trong trang phục hằng ngày.', 319000.00, 1, 1, 'active', '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(62, 2, 'Áo sơ mi Ocean Breeze nền be', 'Hình rùa biển và hoa nhiệt đới lớn phối nền be, cổ mở tay ngắn. Dễ kết hợp trong trang phục hằng ngày.', 309000.00, 1, 1, 'active', '2026-10-26 09:41:45', '2026-10-26 09:41:45'),
(63, 2, 'Áo sơ mi sóng biển phối túi ngực', 'Các dải sóng xanh ngọc và cam phủ áo, có túi ngực và cổ bẻ. Dễ kết hợp trong trang phục hằng ngày.', 269000.00, 1, 1, 'active', '2026-10-26 09:41:45', '2026-10-26 09:41:45'),
(64, 2, 'Áo sơ mi sóng biển điểm kính mát', 'Nền sóng biển xanh ngọc và mặt trời cam, điểm hình kính mát ở ngực. Dễ kết hợp trong trang phục hằng ngày.', 279000.00, 1, 1, 'active', '2026-10-26 09:41:45', '2026-10-26 09:41:45'),
(65, 2, 'Áo sơ mi chanh vàng và sóng biển', 'Họa tiết chanh ở vai kết hợp mặt trời vàng và sóng xanh phía dưới. Dễ kết hợp trong trang phục hằng ngày.', 279000.00, 1, 1, 'active', '2026-10-26 09:41:45', '2026-10-26 09:41:45'),
(66, 1, 'Áo thun phong cảnh trăng đen', 'Khung hình phong cảnh xanh đen với cây và ánh trăng trên nền áo đen. Dễ kết hợp trong trang phục hằng ngày.', 179000.00, 1, 1, 'active', '2026-10-26 09:41:45', '2026-10-26 09:41:45'),
(67, 2, 'Áo sơ mi Beach Club xanh hoa nhí', 'Nền xanh hoa nhí kết hợp hình cây dừa, bãi biển và chữ Beach Club lớn. Dễ kết hợp trong trang phục hằng ngày.', 289000.00, 1, 1, 'active', '2026-10-26 09:41:45', '2026-10-26 09:41:45');

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
CREATE TABLE IF NOT EXISTS `product_images` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint UNSIGNED NOT NULL,
  `image_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int UNSIGNED NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_image_product` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=146 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `image_path`, `is_primary`, `sort_order`, `created_at`, `updated_at`) VALUES
(18, 7, '/storage/products/RUAbNzUDHP5Fm4eWrpA1gdSgFlMHnmtO3IXEMowo.png', 1, 0, '2026-10-26 09:34:37', '2026-10-26 09:34:37'),
(19, 8, '/storage/products/lvtn-ao-19ce4c42e116.png', 1, 0, '2026-10-26 09:41:42', '2026-10-26 09:41:42'),
(20, 9, '/storage/products/lvtn-ao-1a1771f01fb2.png', 1, 0, '2026-10-26 09:41:42', '2026-10-26 09:41:42'),
(21, 10, '/storage/products/lvtn-ao-38dc766179f2.png', 1, 0, '2026-10-26 09:41:42', '2026-10-26 09:41:42'),
(22, 11, '/storage/products/lvtn-ao-4eccad6634b3.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(23, 12, '/storage/products/lvtn-ao-513562b9fbec.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(24, 13, '/storage/products/lvtn-ao-6f6c3b35db7c.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(25, 14, '/storage/products/lvtn-ao-83880a49d979.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(26, 15, '/storage/products/lvtn-ao-8ec65bbe51a3.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(27, 16, '/storage/products/lvtn-ao-938117b66f8e.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(28, 17, '/storage/products/lvtn-ao-939af6a7d628.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(29, 18, '/storage/products/lvtn-ao-9624260fd551.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(30, 19, '/storage/products/lvtn-ao-984c4ef32744.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(31, 20, '/storage/products/lvtn-ao-9ca160086616.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(32, 21, '/storage/products/lvtn-ao-b53a8db62f1f.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(33, 22, '/storage/products/lvtn-ao-cba010b8b017.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(34, 23, '/storage/products/lvtn-ao-d2e7ae572ce8.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(35, 24, '/storage/products/lvtn-aosomi-1.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(36, 25, '/storage/products/lvtn-aosomi-2.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(37, 26, '/storage/products/lvtn-aosomi-3.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(38, 27, '/storage/products/lvtn-aosomi-4.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(39, 28, '/storage/products/lvtn-aosomi-5.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(40, 29, '/storage/products/lvtn-aothun-1.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(41, 30, '/storage/products/lvtn-aothun-2.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(42, 31, '/storage/products/lvtn-aothun-3.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(43, 32, '/storage/products/lvtn-aothun-4.png', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(44, 33, '/storage/products/lvtn-download-1.webp', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(46, 35, '/storage/products/lvtn-download-3.webp', 1, 0, '2026-10-26 09:41:43', '2026-10-26 09:41:43'),
(48, 37, '/storage/products/lvtn-OIP-1.webp', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(51, 40, '/storage/products/lvtn-phukien-1.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(52, 41, '/storage/products/lvtn-phukien-2.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(53, 42, '/storage/products/lvtn-phukien-3.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(54, 43, '/storage/products/lvtn-phukien-4.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(55, 44, '/storage/products/lvtn-phukien-5.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(56, 45, '/storage/products/lvtn-quandui-1.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(57, 46, '/storage/products/lvtn-quandui-2.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(58, 47, '/storage/products/lvtn-quandui-3.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(59, 48, '/storage/products/lvtn-quandui-4.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(61, 50, '/storage/products/lvtn-shirt.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(62, 51, '/storage/products/lvtn-sunea-20260923-182724-7a0e30.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(63, 52, '/storage/products/lvtn-sunea-20260923-182853-01b381.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(64, 53, '/storage/products/lvtn-sunea-20260923-183023-55cd38.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(65, 54, '/storage/products/lvtn-sunea-20260923-183058-6e8ea0.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(66, 55, '/storage/products/lvtn-sunea-20260929-012205-6be6c9.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(67, 56, '/storage/products/lvtn-sunea-20260929-104307-73324f.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(68, 57, '/storage/products/lvtn-sunea-20260929-104456-8cedad.png', 1, 0, '2026-10-26 09:41:44', '2026-10-26 09:41:44'),
(80, 66, '/storage/products/lvtn-sunea-20261011-160403-80d441.png', 1, 0, '2026-10-26 09:45:26', '2026-10-26 09:45:26'),
(82, 64, '/storage/products/lvtn-sunea-20261005-085450-f86edb.png', 1, 0, '2026-10-26 09:46:12', '2026-10-26 09:46:12'),
(83, 63, '/storage/products/lvtn-sunea-20261005-085420-482d16.png', 1, 0, '2026-10-26 09:46:23', '2026-10-26 09:46:23'),
(84, 62, '/storage/products/lvtn-sunea-20261005-085359-d44b90.png', 1, 0, '2026-10-26 09:46:33', '2026-10-26 09:46:33'),
(85, 61, '/storage/products/lvtn-sunea-20261005-085332-0834be.png', 1, 0, '2026-10-26 09:46:43', '2026-10-26 09:46:43'),
(86, 60, '/storage/products/lvtn-sunea-20261005-085253-209176.png', 1, 0, '2026-10-26 09:46:56', '2026-10-26 09:46:56'),
(87, 59, '/storage/products/lvtn-sunea-20261005-085209-b7d000.png', 1, 0, '2026-10-26 09:47:10', '2026-10-26 09:47:10'),
(88, 58, '/storage/products/lvtn-sunea-20260929-104559-511c8b.png', 1, 0, '2026-10-26 09:47:31', '2026-10-26 09:47:31'),
(89, 67, '/storage/products/lvtn-sunea-20261017-194754-a57479.png', 1, 0, '2026-10-26 10:03:58', '2026-10-26 10:03:58'),
(90, 67, '/storage/products/XhXyqS0Rt9LN3s1YF5YUzDvCdyat1JRhJki0FV4l.png', 0, 1, '2026-10-26 10:03:58', '2026-10-26 10:03:58'),
(91, 49, '/storage/products/lvtn-quandui-5.png', 1, 0, '2026-10-26 16:55:10', '2026-10-26 16:55:10'),
(136, 65, '/storage/products/lvtn-sunea-20261005-085605-b0a7f1.png', 1, 0, '2026-10-31 07:57:37', '2026-10-31 07:57:37');

-- --------------------------------------------------------

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` bigint UNSIGNED NOT NULL,
  `size` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `stock` int UNSIGNED NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `size_key` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (coalesce(`size`,_utf8mb4'')) STORED,
  `color_key` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (coalesce(`color`,_utf8mb4'')) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_variant_sku` (`sku`),
  UNIQUE KEY `uq_product_variant` (`product_id`,`size_key`,`color_key`)
) ENGINE=InnoDB AUTO_INCREMENT=404 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_variants`
--

INSERT INTO `product_variants` (`id`, `product_id`, `size`, `color`, `sku`, `stock`, `is_active`, `created_at`, `updated_at`) VALUES
(20, 7, 'M', 'Trắng', 'AO001-M-Tr', 15, 1, '2026-10-26 09:34:37', '2026-10-26 09:34:37'),
(21, 8, 'S', 'Trắng', 'LVTN-1-1-S', 20, 1, '2026-10-26 09:41:42', '2026-10-26 09:48:14'),
(22, 8, 'M', 'Trắng', 'LVTN-1-1-M', 20, 1, '2026-10-26 09:41:42', '2026-10-26 09:48:14'),
(23, 8, 'L', 'Trắng', 'LVTN-1-1-L', 20, 1, '2026-10-26 09:41:42', '2026-10-26 09:48:14'),
(24, 8, 'XL', 'Trắng', 'LVTN-1-1-XL', 20, 1, '2026-10-26 09:41:42', '2026-10-26 09:48:14'),
(25, 9, 'S', 'Đỏ', 'LVTN-2-1-S', 20, 1, '2026-10-26 09:41:42', '2026-10-26 09:48:14'),
(26, 9, 'M', 'Đỏ', 'LVTN-2-1-M', 20, 1, '2026-10-26 09:41:42', '2026-10-26 09:48:14'),
(27, 9, 'L', 'Đỏ', 'LVTN-2-1-L', 20, 1, '2026-10-26 09:41:42', '2026-10-26 09:48:14'),
(28, 9, 'XL', 'Đỏ', 'LVTN-2-1-XL', 20, 1, '2026-10-26 09:41:42', '2026-10-26 09:48:14'),
(29, 10, 'S', 'Xanh mint', 'LVTN-3-1-S', 20, 1, '2026-10-26 09:41:42', '2026-10-26 09:48:14'),
(30, 10, 'M', 'Xanh mint', 'LVTN-3-1-M', 20, 1, '2026-10-26 09:41:42', '2026-10-26 09:48:14'),
(31, 10, 'L', 'Xanh mint', 'LVTN-3-1-L', 20, 1, '2026-10-26 09:41:42', '2026-10-26 09:48:14'),
(32, 10, 'XL', 'Xanh mint', 'LVTN-3-1-XL', 20, 1, '2026-10-26 09:41:42', '2026-10-26 09:48:14'),
(33, 11, 'S', 'Đen', 'LVTN-4-1-S', 20, 1, '2026-10-26 09:41:42', '2026-10-26 09:48:14'),
(34, 11, 'M', 'Đen', 'LVTN-4-1-M', 20, 1, '2026-10-26 09:41:42', '2026-10-26 09:48:14'),
(35, 11, 'L', 'Đen', 'LVTN-4-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(36, 11, 'XL', 'Đen', 'LVTN-4-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(37, 12, 'S', 'Trắng', 'LVTN-5-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(38, 12, 'M', 'Trắng', 'LVTN-5-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(39, 12, 'L', 'Trắng', 'LVTN-5-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(40, 12, 'XL', 'Trắng', 'LVTN-5-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(41, 13, 'S', 'Đỏ', 'LVTN-6-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(42, 13, 'M', 'Đỏ', 'LVTN-6-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(43, 13, 'L', 'Đỏ', 'LVTN-6-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(44, 13, 'XL', 'Đỏ', 'LVTN-6-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(45, 14, 'S', 'Xanh dương / Trắng', 'LVTN-7-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(46, 14, 'M', 'Xanh dương / Trắng', 'LVTN-7-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(47, 14, 'L', 'Xanh dương / Trắng', 'LVTN-7-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(48, 14, 'XL', 'Xanh dương / Trắng', 'LVTN-7-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(49, 15, 'S', 'Trắng', 'LVTN-8-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(50, 15, 'M', 'Trắng', 'LVTN-8-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(51, 15, 'L', 'Trắng', 'LVTN-8-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(52, 15, 'XL', 'Trắng', 'LVTN-8-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(53, 16, 'S', 'Trắng', 'LVTN-9-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(54, 16, 'M', 'Trắng', 'LVTN-9-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(55, 16, 'L', 'Trắng', 'LVTN-9-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(56, 16, 'XL', 'Trắng', 'LVTN-9-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(57, 17, 'S', 'Vàng kem', 'LVTN-10-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(58, 17, 'M', 'Vàng kem', 'LVTN-10-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(59, 17, 'L', 'Vàng kem', 'LVTN-10-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(60, 17, 'XL', 'Vàng kem', 'LVTN-10-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(61, 18, 'S', 'Be', 'LVTN-11-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(62, 18, 'M', 'Be', 'LVTN-11-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(63, 18, 'L', 'Be', 'LVTN-11-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(64, 18, 'XL', 'Be', 'LVTN-11-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(65, 19, 'S', 'Xanh lá nhạt', 'LVTN-12-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(66, 19, 'M', 'Xanh lá nhạt', 'LVTN-12-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(67, 19, 'L', 'Xanh lá nhạt', 'LVTN-12-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(68, 19, 'XL', 'Xanh lá nhạt', 'LVTN-12-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(69, 20, 'S', 'Trắng', 'LVTN-13-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(70, 20, 'M', 'Trắng', 'LVTN-13-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(71, 20, 'L', 'Trắng', 'LVTN-13-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(72, 20, 'XL', 'Trắng', 'LVTN-13-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(73, 21, 'S', 'Xanh navy', 'LVTN-14-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(74, 21, 'M', 'Xanh navy', 'LVTN-14-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(75, 21, 'L', 'Xanh navy', 'LVTN-14-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(76, 21, 'XL', 'Xanh navy', 'LVTN-14-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(77, 22, 'S', 'Trắng', 'LVTN-15-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(78, 22, 'M', 'Trắng', 'LVTN-15-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(79, 22, 'L', 'Trắng', 'LVTN-15-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(80, 22, 'XL', 'Trắng', 'LVTN-15-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(81, 23, 'S', 'Đỏ', 'LVTN-16-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(82, 23, 'M', 'Đỏ', 'LVTN-16-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(83, 23, 'L', 'Đỏ', 'LVTN-16-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(84, 23, 'XL', 'Đỏ', 'LVTN-16-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(85, 24, 'S', 'Xanh lá nhạt', 'LVTN-17-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(86, 24, 'M', 'Xanh lá nhạt', 'LVTN-17-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(87, 24, 'L', 'Xanh lá nhạt', 'LVTN-17-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(88, 24, 'XL', 'Xanh lá nhạt', 'LVTN-17-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(89, 25, 'S', 'Trắng / Xanh lá', 'LVTN-18-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(90, 25, 'M', 'Trắng / Xanh lá', 'LVTN-18-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(91, 25, 'L', 'Trắng / Xanh lá', 'LVTN-18-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(92, 25, 'XL', 'Trắng / Xanh lá', 'LVTN-18-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(93, 26, 'S', 'Xanh dương / Trắng', 'LVTN-19-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(94, 26, 'M', 'Xanh dương / Trắng', 'LVTN-19-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(95, 26, 'L', 'Xanh dương / Trắng', 'LVTN-19-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(96, 26, 'XL', 'Xanh dương / Trắng', 'LVTN-19-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(97, 27, 'S', 'Trắng kem / Vàng', 'LVTN-20-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(98, 27, 'M', 'Trắng kem / Vàng', 'LVTN-20-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(99, 27, 'L', 'Trắng kem / Vàng', 'LVTN-20-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(100, 27, 'XL', 'Trắng kem / Vàng', 'LVTN-20-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(101, 28, 'S', 'Be / Xanh ngọc', 'LVTN-21-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(102, 28, 'M', 'Be / Xanh ngọc', 'LVTN-21-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(103, 28, 'L', 'Be / Xanh ngọc', 'LVTN-21-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(104, 28, 'XL', 'Be / Xanh ngọc', 'LVTN-21-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(105, 29, 'S', 'Trắng', 'LVTN-22-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(106, 29, 'M', 'Trắng', 'LVTN-22-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(107, 29, 'L', 'Trắng', 'LVTN-22-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(108, 29, 'XL', 'Trắng', 'LVTN-22-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(109, 30, 'S', 'Trắng', 'LVTN-23-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(110, 30, 'M', 'Trắng', 'LVTN-23-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(111, 30, 'L', 'Trắng', 'LVTN-23-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(112, 30, 'XL', 'Trắng', 'LVTN-23-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(113, 31, 'S', 'Trắng', 'LVTN-24-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(114, 31, 'M', 'Trắng', 'LVTN-24-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(115, 31, 'L', 'Trắng', 'LVTN-24-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(116, 31, 'XL', 'Trắng', 'LVTN-24-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(117, 32, 'S', 'Trắng', 'LVTN-25-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(118, 32, 'M', 'Trắng', 'LVTN-25-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(119, 32, 'L', 'Trắng', 'LVTN-25-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(120, 32, 'XL', 'Trắng', 'LVTN-25-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(121, 7, 'S', 'Trắng', 'LVTN-26-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(122, 7, 'L', 'Trắng', 'LVTN-26-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(123, 7, 'XL', 'Trắng', 'LVTN-26-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(124, 33, 'Freesize', 'Kem', 'LVTN-27-1-Freesize', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(129, 35, 'S', 'Cam / Xanh dương', 'LVTN-29-1-S', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(130, 35, 'M', 'Cam / Xanh dương', 'LVTN-29-1-M', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(131, 35, 'L', 'Cam / Xanh dương', 'LVTN-29-1-L', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(132, 35, 'XL', 'Cam / Xanh dương', 'LVTN-29-1-XL', 20, 1, '2026-10-26 09:41:43', '2026-10-26 09:48:14'),
(139, 37, 'Freesize', 'Hồng', 'LVTN-31-1-Freesize', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(140, 37, 'Freesize', 'Xanh dương', 'LVTN-31-2-Freesize', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(141, 37, 'Freesize', 'Xanh ngọc', 'LVTN-31-3-Freesize', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(142, 37, 'Freesize', 'Đen', 'LVTN-31-4-Freesize', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(143, 37, 'Freesize', 'Nâu', 'LVTN-31-5-Freesize', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(152, 40, '36', 'Hồng / Trắng kem', 'LVTN-34-1-36', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(153, 40, '37', 'Hồng / Trắng kem', 'LVTN-34-1-37', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(154, 40, '38', 'Hồng / Trắng kem', 'LVTN-34-1-38', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(155, 40, '39', 'Hồng / Trắng kem', 'LVTN-34-1-39', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(156, 40, '40', 'Hồng / Trắng kem', 'LVTN-34-1-40', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(157, 41, 'Freesize', 'Xanh ngọc', 'LVTN-35-1-Freesize', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(158, 42, 'Freesize', 'Nâu tự nhiên', 'LVTN-36-1-Freesize', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(159, 43, 'Freesize', 'Trắng kem / Vàng', 'LVTN-37-1-Freesize', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(160, 44, 'Freesize', 'Kem', 'LVTN-38-1-Freesize', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(161, 45, 'S', 'Xanh lá nhạt', 'LVTN-39-1-S', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(162, 45, 'M', 'Xanh lá nhạt', 'LVTN-39-1-M', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(163, 45, 'L', 'Xanh lá nhạt', 'LVTN-39-1-L', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(164, 45, 'XL', 'Xanh lá nhạt', 'LVTN-39-1-XL', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(165, 46, 'S', 'Trắng / Xanh lá', 'LVTN-40-1-S', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(166, 46, 'M', 'Trắng / Xanh lá', 'LVTN-40-1-M', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(167, 46, 'L', 'Trắng / Xanh lá', 'LVTN-40-1-L', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(168, 46, 'XL', 'Trắng / Xanh lá', 'LVTN-40-1-XL', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(169, 47, 'S', 'Xanh dương / Trắng', 'LVTN-41-1-S', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(170, 47, 'M', 'Xanh dương / Trắng', 'LVTN-41-1-M', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(171, 47, 'L', 'Xanh dương / Trắng', 'LVTN-41-1-L', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(172, 47, 'XL', 'Xanh dương / Trắng', 'LVTN-41-1-XL', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(173, 48, 'S', 'Trắng kem / Vàng', 'LVTN-42-1-S', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(174, 48, 'M', 'Trắng kem / Vàng', 'LVTN-42-1-M', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(175, 48, 'L', 'Trắng kem / Vàng', 'LVTN-42-1-L', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(176, 48, 'XL', 'Trắng kem / Vàng', 'LVTN-42-1-XL', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(181, 50, 'S', 'Trắng', 'LVTN-44-1-S', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(182, 50, 'M', 'Trắng', 'LVTN-44-1-M', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(183, 50, 'L', 'Trắng', 'LVTN-44-1-L', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(184, 50, 'XL', 'Trắng', 'LVTN-44-1-XL', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(185, 51, 'S', 'Xanh navy', 'LVTN-45-1-S', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(186, 51, 'M', 'Xanh navy', 'LVTN-45-1-M', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(187, 51, 'L', 'Xanh navy', 'LVTN-45-1-L', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(188, 51, 'XL', 'Xanh navy', 'LVTN-45-1-XL', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(189, 52, 'S', 'Xanh navy', 'LVTN-46-1-S', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(190, 52, 'M', 'Xanh navy', 'LVTN-46-1-M', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(191, 52, 'L', 'Xanh navy', 'LVTN-46-1-L', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(192, 52, 'XL', 'Xanh navy', 'LVTN-46-1-XL', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(193, 53, 'S', 'Be', 'LVTN-47-1-S', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(194, 53, 'M', 'Be', 'LVTN-47-1-M', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(195, 53, 'L', 'Be', 'LVTN-47-1-L', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(196, 53, 'XL', 'Be', 'LVTN-47-1-XL', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(197, 54, 'S', 'Đen', 'LVTN-48-1-S', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(198, 54, 'M', 'Đen', 'LVTN-48-1-M', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(199, 54, 'L', 'Đen', 'LVTN-48-1-L', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(200, 54, 'XL', 'Đen', 'LVTN-48-1-XL', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(201, 55, 'S', 'Trắng', 'LVTN-49-1-S', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(202, 55, 'M', 'Trắng', 'LVTN-49-1-M', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(203, 55, 'L', 'Trắng', 'LVTN-49-1-L', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(204, 55, 'XL', 'Trắng', 'LVTN-49-1-XL', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(205, 56, 'S', 'Đỏ', 'LVTN-50-1-S', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(206, 56, 'M', 'Đỏ', 'LVTN-50-1-M', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(207, 56, 'L', 'Đỏ', 'LVTN-50-1-L', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(208, 56, 'XL', 'Đỏ', 'LVTN-50-1-XL', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(209, 57, 'S', 'Đen', 'LVTN-51-1-S', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(210, 57, 'M', 'Đen', 'LVTN-51-1-M', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(211, 57, 'L', 'Đen', 'LVTN-51-1-L', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(212, 57, 'XL', 'Đen', 'LVTN-51-1-XL', 20, 1, '2026-10-26 09:41:44', '2026-10-26 09:48:14'),
(257, 66, 'L', 'Đen', 'LVTN-60-1-L', 11, 1, '2026-10-26 09:45:26', '2026-10-26 09:45:26'),
(258, 66, 'M', 'Đen', 'LVTN-60-1-M', 15, 1, '2026-10-26 09:45:26', '2026-10-31 09:37:32'),
(259, 66, 'S', 'Đen', 'LVTN-60-1-S', 18, 1, '2026-10-26 09:45:26', '2026-10-26 09:45:26'),
(260, 66, 'XL', 'Đen', 'LVTN-60-1-XL', 22, 1, '2026-10-26 09:45:26', '2026-10-31 09:37:32'),
(265, 64, 'L', 'Be / Xanh ngọc', 'LVTN-58-1-L', 11, 1, '2026-10-26 09:46:12', '2026-10-26 09:46:12'),
(266, 64, 'M', 'Be / Xanh ngọc', 'LVTN-58-1-M', 11, 1, '2026-10-26 09:46:12', '2026-10-26 09:46:12'),
(267, 64, 'S', 'Be / Xanh ngọc', 'LVTN-58-1-S', 16, 1, '2026-10-26 09:46:12', '2026-10-26 09:46:12'),
(268, 64, 'XL', 'Be / Xanh ngọc', 'LVTN-58-1-XL', 18, 1, '2026-10-26 09:46:12', '2026-10-26 09:46:12'),
(269, 63, 'L', 'Be / Xanh ngọc', 'LVTN-57-1-L', 11, 1, '2026-10-26 09:46:23', '2026-10-26 09:46:23'),
(270, 63, 'M', 'Be / Xanh ngọc', 'LVTN-57-1-M', 11, 1, '2026-10-26 09:46:23', '2026-10-26 09:46:23'),
(271, 63, 'S', 'Be / Xanh ngọc', 'LVTN-57-1-S', 17, 1, '2026-10-26 09:46:23', '2026-10-26 09:46:23'),
(272, 63, 'XL', 'Be / Xanh ngọc', 'LVTN-57-1-XL', 20, 1, '2026-10-26 09:46:23', '2026-10-26 09:46:23'),
(273, 62, 'L', 'Be / Xanh ngọc', 'LVTN-56-1-L', 17, 1, '2026-10-26 09:46:33', '2026-10-26 09:46:33'),
(274, 62, 'M', 'Be / Xanh ngọc', 'LVTN-56-1-M', 5, 1, '2026-10-26 09:46:33', '2026-10-26 09:46:33'),
(275, 62, 'S', 'Be / Xanh ngọc', 'LVTN-56-1-S', 6, 1, '2026-10-26 09:46:33', '2026-10-26 09:46:33'),
(276, 62, 'XL', 'Be / Xanh ngọc', 'LVTN-56-1-XL', 12, 1, '2026-10-26 09:46:33', '2026-10-26 09:46:33'),
(277, 61, 'L', 'Trắng / Xanh ngọc', 'LVTN-55-1-L', 11, 1, '2026-10-26 09:46:43', '2026-10-26 09:46:43'),
(278, 61, 'M', 'Trắng / Xanh ngọc', 'LVTN-55-1-M', 3, 1, '2026-10-26 09:46:43', '2026-10-26 09:46:43'),
(279, 61, 'S', 'Trắng / Xanh ngọc', 'LVTN-55-1-S', 5, 1, '2026-10-26 09:46:43', '2026-10-26 09:46:43'),
(280, 61, 'XL', 'Trắng / Xanh ngọc', 'LVTN-55-1-XL', 10, 1, '2026-10-26 09:46:43', '2026-10-26 09:46:43'),
(281, 60, 'L', 'Trắng', 'LVTN-54-1-L', 20, 1, '2026-10-26 09:46:56', '2026-10-26 09:46:56'),
(282, 60, 'M', 'Trắng', 'LVTN-54-1-M', 20, 1, '2026-10-26 09:46:56', '2026-10-26 09:46:56'),
(283, 60, 'S', 'Trắng', 'LVTN-54-1-S', 21, 1, '2026-10-26 09:46:56', '2026-10-26 09:46:56'),
(284, 60, 'XL', 'Trắng', 'LVTN-54-1-XL', 20, 1, '2026-10-26 09:46:56', '2026-10-26 09:46:56'),
(285, 59, 'L', 'Xanh mint', 'LVTN-53-1-L', 24, 1, '2026-10-26 09:47:10', '2026-10-26 09:47:10'),
(286, 59, 'M', 'Xanh mint', 'LVTN-53-1-M', 18, 1, '2026-10-26 09:47:10', '2026-10-26 09:47:10'),
(287, 59, 'S', 'Xanh mint', 'LVTN-53-1-S', 29, 1, '2026-10-26 09:47:10', '2026-10-26 09:47:10'),
(288, 59, 'XL', 'Xanh mint', 'LVTN-53-1-XL', 25, 1, '2026-10-26 09:47:10', '2026-10-26 09:47:10'),
(289, 58, 'L', 'Đen', 'LVTN-52-1-L', 22, 1, '2026-10-26 09:47:31', '2026-10-26 09:47:31'),
(290, 58, 'M', 'Đen', 'LVTN-52-1-M', 19, 1, '2026-10-26 09:47:31', '2026-10-26 09:47:31'),
(291, 58, 'S', 'Đen', 'LVTN-52-1-S', 23, 1, '2026-10-26 09:47:31', '2026-10-26 09:47:31'),
(292, 58, 'XL', 'Đen', 'LVTN-52-1-XL', 18, 1, '2026-10-26 09:47:31', '2026-10-26 09:47:31'),
(293, 67, 'L', 'Xanh lá nhạt', 'LVTN-61-1-L', 12, 1, '2026-10-26 10:03:58', '2026-10-26 10:03:58'),
(294, 67, 'M', 'Xanh lá nhạt', 'LVTN-61-1-M', 9, 1, '2026-10-26 10:03:58', '2026-10-31 09:37:32'),
(295, 67, 'S', 'Xanh lá nhạt', 'LVTN-61-1-S', 22, 1, '2026-10-26 10:03:58', '2026-10-26 10:03:58'),
(296, 67, 'XL', 'Xanh lá nhạt', 'LVTN-61-1-XL', 29, 1, '2026-10-26 10:03:58', '2026-10-26 10:03:58'),
(297, 67, 'S', 'Trắng', 'LVTN-T', 9, 1, '2026-10-26 10:03:58', '2026-10-31 09:37:32'),
(298, 49, 'L', 'Be / Xanh ngọc', 'LVTN-43-1-L', 20, 0, '2026-10-26 16:55:10', '2026-10-26 16:55:10'),
(299, 49, 'M', 'Be / Xanh ngọc', 'LVTN-43-1-M', 20, 0, '2026-10-26 16:55:10', '2026-10-26 16:55:10'),
(300, 49, 'S', 'Be / Xanh ngọc', 'LVTN-43-1-S', 20, 1, '2026-10-26 16:55:10', '2026-10-26 16:55:10'),
(301, 49, 'XL', 'Be / Xanh ngọc', 'LVTN-43-1-XL', 20, 1, '2026-10-26 16:55:10', '2026-10-26 16:55:10'),
(384, 65, 'L', 'Vàng kem', 'P65-L-VANG-KEM', 10, 1, '2026-10-31 07:57:37', '2026-10-31 07:57:37'),
(385, 65, 'L', 'Xanh Ngọc', 'P65-L-XANH-NGOC', 10, 1, '2026-10-31 07:57:37', '2026-10-31 07:57:37'),
(386, 65, 'M', 'Vàng kem', 'P65-M-VANG-KEM', 10, 1, '2026-10-31 07:57:37', '2026-10-31 07:57:37'),
(387, 65, 'M', 'Xanh Ngọc', 'P65-M-XANH-NGOC', 10, 1, '2026-10-31 07:57:37', '2026-10-31 07:57:37'),
(388, 65, 'S', 'Vàng kem', 'P65-S-VANG-KEM', 10, 1, '2026-10-31 07:57:37', '2026-10-31 07:57:37'),
(389, 65, 'S', 'Xanh Ngọc', 'P65-S-XANH-NGOC', 10, 1, '2026-10-31 07:57:37', '2026-10-31 07:57:37'),
(390, 65, 'XL', 'Vàng kem', 'P65-XL-VANG-KEM', 10, 1, '2026-10-31 07:57:37', '2026-10-31 07:57:37'),
(391, 65, 'XL', 'Xanh Ngọc', 'P65-XL-XANH-NGOC', 10, 1, '2026-10-31 07:57:37', '2026-10-31 07:57:37');

-- --------------------------------------------------------

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
CREATE TABLE IF NOT EXISTS `promotions` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_percent` decimal(5,2) NOT NULL,
  `minimum_subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `per_customer_limit` int UNSIGNED NOT NULL DEFAULT '1',
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_promotions_code` (`code`),
  KEY `idx_promotions_active_dates` (`is_active`,`starts_at`,`ends_at`)
) ;

-- --------------------------------------------------------

--
-- Table structure for table `promotion_redemptions`
--

DROP TABLE IF EXISTS `promotion_redemptions`;
CREATE TABLE IF NOT EXISTS `promotion_redemptions` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `promotion_id` bigint UNSIGNED DEFAULT NULL,
  `order_id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `discount_amount` decimal(12,2) NOT NULL,
  `reversed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_redemptions_order` (`order_id`),
  KEY `idx_redemptions_customer_limit` (`promotion_id`,`user_id`,`reversed_at`),
  KEY `fk_redemptions_user` (`user_id`)
) ;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','customer') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer',
  `status` enum('active','locked') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=352 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password`, `role`, `status`, `email_verified_at`, `remember_token`, `created_at`, `updated_at`, `deleted_at`) VALUES
(284, 'Bích Võ', 'bichvt2307@gmail.com', '0395463733', '$2y$12$sWHEamH8uAmT2YwbbvE36eRWVwKJ1fIZOFYPP2pwj0ug/AxquyGoK', 'customer', 'active', '2026-10-31 08:16:11', 'O28Ba7AdprqZoUIw9faQWX2K3FtxudW2bKPddMwxNg5qO8fYyl253pJR4GIq', '2026-10-31 08:15:42', '2026-10-31 08:17:13', NULL),
(307, 'Admin', 'tricker0411@gmail.com', '0363695662', '$2y$12$RvquDhEyJXP9jf1ItDsfMukQw9LiHpBf7iKrUAKaQR8EKwhxlOmou', 'admin', 'active', '2026-10-31 09:40:05', NULL, '2026-10-31 09:39:43', '2026-10-31 09:40:05', NULL);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `email_otps`
--
ALTER TABLE `email_otps`
  ADD CONSTRAINT `fk_email_otps_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `fk_invoices_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `order_items_product_variant_id_foreign` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_status_histories`
--
ALTER TABLE `order_status_histories`
  ADD CONSTRAINT `order_status_histories_changed_by_user_id_foreign` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `order_status_histories_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_confirmed_by` FOREIGN KEY (`confirmed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_image_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `fk_variant_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `promotion_redemptions`
--
ALTER TABLE `promotion_redemptions`
  ADD CONSTRAINT `fk_redemptions_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_redemptions_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_redemptions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
