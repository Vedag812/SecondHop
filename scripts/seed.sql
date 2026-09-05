INSERT OR IGNORE INTO users (id, role, display_name, created_at, updated_at) VALUES
('buyer_a_01','buyer_a','Maya Rao','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_b_01','buyer_b','Arjun Mehta','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_a_02','buyer_a','Sneha Iyer','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_b_02','buyer_b','Rohan Varma','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_a_03','buyer_a','Kavya Sharma','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_b_03','buyer_b','Aditya Sen','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_a_04','buyer_a','Karthik Raj','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_b_04','buyer_b','Pooja Hegde','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_a_05','buyer_a','Ananya Reddy','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_b_05','buyer_b','Deepak Nair','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_a_06','buyer_a','Rahul Joshi','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_b_06','buyer_b','Tarun Bose','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_a_07','buyer_a','Sanya Gupta','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_b_07','buyer_b','Vidya Pillai','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_a_08','buyer_a','Nikhil Das','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_b_08','buyer_b','Varun Grover','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_a_09','buyer_a','Prateek Jain','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_b_09','buyer_b','Alok Kulkarni','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_a_10','buyer_a','Ishaan Roy','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('buyer_b_10','buyer_b','Mansi Bansal','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z');

INSERT OR IGNORE INTO products (id, merchant_id, sku, model, variant, category, warranty, created_at, updated_at) VALUES
('prod_wh40_blue','merchant_soundwave_01','SND-WH40-BLU-IN','WH40','Midnight Blue','electronics','full_manufacturer','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('prod_sony_xm5','merchant_soundwave_01','SNY-WH1000XM5-SLV','WH-1000XM5','Platinum Silver','electronics','full_manufacturer','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('prod_airpods_pro2','merchant_soundwave_01','APL-APP2-USBC-WHT','AirPods Pro 2','Gloss White','electronics','full_manufacturer','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('prod_galaxy_watch6','merchant_soundwave_01','SAM-GW6-44LTE-GRP','Galaxy Watch 6 LTE','Graphite Black','electronics','full_manufacturer','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('prod_mx_master3s','merchant_soundwave_01','LOG-MXM3S-GRY-IN','MX Master 3S','Space Gray','electronics','full_manufacturer','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('prod_bose_qc_ultra','merchant_soundwave_01','BOS-QCU-BLK-01','QuietComfort Ultra','Triple Black','electronics','full_manufacturer','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('prod_kindle_pw11','merchant_soundwave_01','AMZ-KNDL-PW11-BLK','Kindle Paperwhite (11th Gen)','Signature Black','electronics','full_manufacturer','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('prod_dji_osmo_pocket3','merchant_soundwave_01','DJI-OP3-CREATOR-01','Osmo Pocket 3','Standard Gray','electronics','full_manufacturer','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('prod_keychron_k2pro','merchant_soundwave_01','KEY-K2PRO-RGB-HOT','Keychron K2 Pro','RGB Hot-swap','electronics','full_manufacturer','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z'),
('prod_nothing_ear2','merchant_soundwave_01','NOT-EAR2-WHT-01','Nothing Ear (2)','Transparent White','electronics','full_manufacturer','2026-09-04T08:30:00Z','2026-09-04T08:30:00Z');

INSERT OR IGNORE INTO original_orders (id, buyer_id, product_id, serial_number, amount_paise, razorpay_payment_id, status, created_at, updated_at) VALUES
('SW-390184','buyer_a_01','prod_wh40_blue','WH40-IN-884921',129900,'pay_original_fixture','captured','2026-09-01T09:00:00Z','2026-09-04T08:30:00Z'),
('SW-390191','buyer_a_02','prod_sony_xm5','SNY-XM5-992104',2699000,'pay_sony_fixture','captured','2026-09-01T10:00:00Z','2026-09-04T08:30:00Z'),
('SW-390192','buyer_a_03','prod_airpods_pro2','APL-APP2-338291',2490000,'pay_airpods_fixture','captured','2026-09-01T11:00:00Z','2026-09-04T08:30:00Z'),
('SW-390193','buyer_a_04','prod_galaxy_watch6','SM-R945F-481902',2999900,'pay_watch_fixture','captured','2026-09-01T12:00:00Z','2026-09-04T08:30:00Z'),
('SW-390194','buyer_a_05','prod_mx_master3s','MX-M3S-829104',1099500,'pay_mouse_fixture','captured','2026-09-01T13:00:00Z','2026-09-04T08:30:00Z'),
('SW-390195','buyer_a_06','prod_bose_qc_ultra','BOS-QCU-672109',3590000,'pay_bose_fixture','captured','2026-09-01T14:00:00Z','2026-09-04T08:30:00Z'),
('SW-390196','buyer_a_07','prod_kindle_pw11','KNDL-PW16-559102',1499900,'pay_kindle_fixture','captured','2026-09-01T15:00:00Z','2026-09-04T08:30:00Z'),
('SW-390197','buyer_a_08','prod_dji_osmo_pocket3','DJI-OP3-902184',5399000,'pay_dji_fixture','captured','2026-09-01T16:00:00Z','2026-09-04T08:30:00Z'),
('SW-390198','buyer_a_09','prod_keychron_k2pro','KEY-K2P-349012',1199900,'pay_keychron_fixture','captured','2026-09-01T17:00:00Z','2026-09-04T08:30:00Z'),
('SW-390199','buyer_a_10','prod_nothing_ear2','NOT-E2-771920',999900,'pay_nothing_fixture','captured','2026-09-01T18:00:00Z','2026-09-04T08:30:00Z');

INSERT OR IGNORE INTO returns (id, order_id, reason_original, claimed_condition, state, eligibility, created_at, updated_at) VALUES
('RTN-24094','SW-390184','The blue looked darker than I expected. I have not opened the box.','factory_sealed','MATCH_MERCHANT_APPROVED',1,'2026-09-04T08:32:00Z','2026-09-04T08:33:01Z'),
('RTN-24091','SW-390191','Gifted another pair on birthday. Box completely sealed and pristine.','factory_sealed','MATCH_MERCHANT_APPROVED',1,'2026-09-04T08:32:00Z','2026-09-04T08:33:01Z'),
('RTN-24089','SW-390192','Wanted over-ear headphones instead of in-ear. Pull-tab seal is untouched.','factory_sealed','MATCH_MERCHANT_APPROVED',1,'2026-09-04T08:32:00Z','2026-09-04T08:33:01Z'),
('RTN-24085','SW-390193','Duplicate purchase, family bought one too. Box unopened with seals intact.','factory_sealed','MATCH_MERCHANT_APPROVED',1,'2026-09-04T08:32:00Z','2026-09-04T08:33:01Z'),
('RTN-24082','SW-390194','Workplace already provided mouse before delivery. Unopened retail packaging.','factory_sealed','MATCH_MERCHANT_APPROVED',1,'2026-09-04T08:32:00Z','2026-09-04T08:33:01Z'),
('RTN-24079','SW-390195','Ordered White Smoke by mistake, received Triple Black. Left sealed.','factory_sealed','MATCH_MERCHANT_APPROVED',1,'2026-09-04T08:32:00Z','2026-09-04T08:33:01Z'),
('RTN-24076','SW-390196','Already had Kindle Oasis, decided not to switch. Box untouched.','factory_sealed','MATCH_MERCHANT_APPROVED',1,'2026-09-04T08:32:00Z','2026-09-04T08:33:01Z'),
('RTN-24073','SW-390197','Travel plans canceled. Creator Combo box never opened.','factory_sealed','MATCH_MERCHANT_APPROVED',1,'2026-09-04T08:32:00Z','2026-09-04T08:33:01Z'),
('RTN-24070','SW-390198','Wanted 100% full-size keyboard with numpad instead of 75%. Unopened.','factory_sealed','MATCH_MERCHANT_APPROVED',1,'2026-09-04T08:32:00Z','2026-09-04T08:33:01Z'),
('RTN-24067','SW-390199','Received as corporate reward, already have earphones. Sealed in original box.','factory_sealed','MATCH_MERCHANT_APPROVED',1,'2026-09-04T08:32:00Z','2026-09-04T08:33:01Z');

INSERT OR IGNORE INTO purchase_intents (id, buyer_id, original_input, structured_json, price_ceiling_paise, maximum_distance_km, expires_at, created_at, updated_at) VALUES
('INT-884921','buyer_b_01','Find SoundWave WH40 headphones in Midnight Blue for no more than ₹1,150. I need them today within 3 km. Only unopened with full warranty.','{"model":"WH40","colour":"Midnight Blue","substitutions_allowed":false}',115000,3,'2026-09-04T14:30:00Z','2026-09-04T08:31:00Z','2026-09-04T08:31:00Z'),
('INT-992104','buyer_b_02','Sony WH-1000XM5 in Silver, sealed with bill and warranty, budget ₹19,500.','{"model":"WH-1000XM5","colour":"Platinum Silver","substitutions_allowed":false}',1950000,5,'2026-09-04T14:30:00Z','2026-09-04T08:31:00Z','2026-09-04T08:31:00Z'),
('INT-338291','buyer_b_03','Apple AirPods Pro 2 USB-C version, unopened, genuine bill, under ₹17,500.','{"model":"AirPods Pro 2","colour":"Gloss White","substitutions_allowed":false}',1750000,5,'2026-09-04T14:30:00Z','2026-09-04T08:31:00Z','2026-09-04T08:31:00Z'),
('INT-481902','buyer_b_04','Galaxy Watch 6 LTE 44mm Graphite, sealed unit under ₹18,500.','{"model":"Galaxy Watch 6 LTE","colour":"Graphite Black","substitutions_allowed":false}',1850000,4,'2026-09-04T14:30:00Z','2026-09-04T08:31:00Z','2026-09-04T08:31:00Z'),
('INT-829104','buyer_b_05','Logitech MX Master 3S Quiet Clicks mouse, sealed box under ₹7,000.','{"model":"MX Master 3S","colour":"Space Gray","substitutions_allowed":false}',700000,5,'2026-09-04T14:30:00Z','2026-09-04T08:31:00Z','2026-09-04T08:31:00Z');
