-- 奥东加油站官方问答：新增条目 + 替换语义相近的旧问答
-- 可重复执行（按固定 id / 问题更新）

-- 替换：营业时间（原「你们几点开门？」）
UPDATE kb_qa
SET
  question = '奥东加油站营业时间是多久？',
  answer = '本站实行24小时全天候营业，全年无休，节假日、雨雪天气正常服务，随时为您提供加油、充电、购物便民服务。',
  category = '营业时间',
  status = 'online',
  embed_status = 'pending',
  updated_at = now(),
  published_at = COALESCE(published_at, now())
WHERE id = '00000000-0000-4000-8000-000000000001'
  AND station_id = 'default';

-- 替换：积分与发票（原「可以开发票吗？」）
UPDATE kb_qa
SET
  question = '本站消费可以累计积分、开发票吗？',
  answer = '加油、便利店购物均可累计会员积分，积分可兑换商品、抵扣消费；所有消费均可开具正规电子发票、纸质发票，支持现场开具和线上自助开票。',
  category = '其他',
  status = 'online',
  embed_status = 'pending',
  updated_at = now(),
  published_at = COALESCE(published_at, now())
WHERE id = '00000000-0000-4000-8000-000000000005'
  AND station_id = 'default';

-- 下线：与新版 24 小时营业表述重复（原节假日营业时间草稿）
UPDATE kb_qa
SET
  status = 'offline',
  embed_status = 'none',
  updated_at = now()
WHERE id = '00000000-0000-4000-8000-000000000009'
  AND station_id = 'default';

INSERT INTO kb_qa (
  id,
  station_id,
  question,
  answer,
  category,
  status,
  embed_status,
  updated_at,
  published_at
)
VALUES
  (
    '00000000-0000-4000-8000-000000000011',
    'default',
    '北京奥东加油站具体位置在哪里？',
    '我们站点位于北京市朝阳区来广营东路17号，来广营东路与马泉营西路丁字路口，紧邻崔各庄县政府，地理位置优越，交通便捷。',
    '其他',
    'online',
    'pending',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000012',
    'default',
    '奥东加油站是什么等级的站点？有什么特色？',
    '本站是中国石油北京销售公司五星级标杆加油站，也是北京市首座中石油油电一体化综合能源站，2024年全新升级改造，集加油、新能源充电、便利店购物、车辆便民服务于一体，是现代化绿色综合能源服务站点。',
    '其他',
    'online',
    'pending',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000013',
    'default',
    '本站有哪些油品可以加注？',
    '本站油品品类齐全，提供92#、95#、98#国标汽油和0#国标柴油，所有油品均为中石油统一配送，计量精准、品质保真，适配家用车、高端车、货车、工程机械等各类车辆。',
    '加油机',
    'online',
    'pending',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000014',
    'default',
    '本站油品品质有保障吗？',
    '请您放心，本站严格执行五星品控标准，油品双人验收复核，加油机定期官方质检、站内自检，全程溯源可查，坚守每一滴油都是承诺的服务理念，诚信合规经营。',
    '加油机',
    'online',
    'pending',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000015',
    'default',
    '本站可以给新能源汽车充电吗？',
    '可以的。本站是北京首批油电综合能源站，配备10个充电车位、多组快充及超级快充枪，适配所有品牌新能源汽车，手机扫码即可充电，安全高效、计费透明。',
    '其他',
    'online',
    'pending',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000016',
    'default',
    '站内有免费便民服务吗？',
    '有的。本站免费提供饮用热水、公共卫生间、临时休息区、手机充电、车辆简易检查等便民服务，全程无消费门槛。',
    '其他',
    'online',
    'pending',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000017',
    'default',
    '奥东加油站便利店售卖哪些商品？',
    '本站易捷便利店品类丰富，涵盖零食速食、冷热饮品、日用百货、正品烟酒、地方特产、节日礼盒、全套车用养护用品等近千种商品，满足出行补给和日常消费需求。',
    '便利店',
    'online',
    'pending',
    now(),
    now()
  )
ON CONFLICT (id) DO UPDATE SET
  question = EXCLUDED.question,
  answer = EXCLUDED.answer,
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  embed_status = EXCLUDED.embed_status,
  updated_at = EXCLUDED.updated_at,
  published_at = COALESCE(kb_qa.published_at, EXCLUDED.published_at);
