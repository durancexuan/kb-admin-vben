-- 奥东问答口语别名（与 008 官方问答同答案，便于机器人命中）
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
    '00000000-0000-4000-8000-000000000018',
    'default',
    '奥东加油站地址在哪里？',
    '我们站点位于北京市朝阳区来广营东路17号，来广营东路与马泉营西路丁字路口，紧邻崔各庄县政府，地理位置优越，交通便捷。',
    '其他',
    'online',
    'pending',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000019',
    'default',
    '可以开发票吗？',
    '加油、便利店购物均可累计会员积分，积分可兑换商品、抵扣消费；所有消费均可开具正规电子发票、纸质发票，支持现场开具和线上自助开票。',
    '其他',
    'online',
    'pending',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000020',
    'default',
    '积分怎么累计？',
    '加油、便利店购物均可累计会员积分，积分可兑换商品、抵扣消费；所有消费均可开具正规电子发票、纸质发票，支持现场开具和线上自助开票。',
    '其他',
    'online',
    'pending',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000021',
    'default',
    '能给电动车充电吗？',
    '可以的。本站是北京首批油电综合能源站，配备10个充电车位、多组快充及超级快充枪，适配所有品牌新能源汽车，手机扫码即可充电，安全高效、计费透明。',
    '其他',
    'online',
    'pending',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000022',
    'default',
    '你们几点开门？',
    '本站实行24小时全天候营业，全年无休，节假日、雨雪天气正常服务，随时为您提供加油、充电、购物便民服务。',
    '营业时间',
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
