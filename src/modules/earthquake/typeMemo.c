# 緊急地震速報
{"type":"eew",
"time":long,
"report":int,
"epicenter":String,
"depth":String,
"magnitude":String,
"latitude":String,
"longitude":String,
"intensity":String,
"index":int
}

# 地震検知
{"type":"pga_alert",
"time":long,
"max_pga":float,
"new":boolean,
"estimated_intensity":int,
"region_list":[String,String,,,]
}

# 地震検知キャンセル
{"type":"pga_alert_cancel", "time":long }

# 震度レポート
{"type":"intensity_report",
"time":long,
"max_index":int,
"intensity_list":[
{"intensity":String,
"index":int,
"region_list":[String,String,,,,]},
{"intensity":String,
"index":int,
"region_list":[String,String,,,,]},
,,]
}
