import autobind from "autobind-decorator";
import Module from "@/module";
import Message from "@/message";
import * as http from "http";

// 基本的に生データはstringばっかり。都合のいい形に加工済みの状態の型定義を書いています。
// ここでいくらか言及されてる(https://bultar.bbs.fc2.com/?act=reply&tid=5645851);
interface 緊急地震速報 {
	type: 'eew';
	time: Date;
	report: string; // 第n報 最終報はstringで'final'となるので、とりあえずstring型
	epicenter: string; // 震源地
	depth: string; // 震源の深さ
	magnitude: string; // 地震の規模を示すマグニチュード
	latitude: string; // 緯度らしいが謎
	longitude: string; // 経度らしいが謎
	intensity: string; // 地震の強さ
	index: number; // 謎
}

interface 緊急地震速報キャンセル {
	type: 'pga_alert_cancel';
	time: Date;
}

interface 震度レポート {
  type: 'intensity_report';
  time: Date;
  max_index: number;
  intensity_list: {
		intensity: string;
		index: number;
		region_list: string[];
	}[];
}

interface 地震検知 {
  type: 'pga_alert';
  time: Date;
  max_pga: number;
  new: boolean;
  estimated_intensity: number;
  region_list: string[];
}

export default class extends Module {
  public readonly name = "earthquake";
  private message: string = "";

  @autobind
  public install() {
    this.createListenServer();
    return {};
  }

  @autobind
  private async createListenServer() {
    http.createServer(async (req, res) => {
      const buffers: Buffer[] = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }

      const rawDataString = Buffer.concat(buffers).toString();
      // rawDataString について、Unicodeエスケープシーケンスが含まれていたら通常の文字列に変換する
      // JSONでなければreturn falseする
      if (rawDataString.match(/\\u[0-9a-f]{4}/)) {
        const rawDataJSON = JSON.parse(
          rawDataString.replace(/\\u([\d\w]{4})/g, (match, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
          }),
        );

        if (rawDataJSON.type == "pga_alert") {
          const data: 地震検知 = {
            type: rawDataJSON.type,
            time: new Date(parseInt(rawDataJSON.time)),
            max_pga: rawDataJSON.max_pga,
            new: rawDataJSON.new,
            estimated_intensity: rawDataJSON.estimated_intensity,
            region_list: rawDataJSON.region_list,
          };
          this.message =
					// region_listはオブジェクトなので、2行改行してから列挙する
            `PGA Alert\n${data.time.toLocaleString()}\n${data.max_pga}\n${data.estimated_intensity}\n\n${data.region_list.join("\n")}`;
        }else if (rawDataJSON.type == 'intensity_report'){
					const data: 震度レポート = {
						type: rawDataJSON.type,
            time: new Date(parseInt(rawDataJSON.time)),
						max_index: rawDataJSON.max_index,
						intensity_list: rawDataJSON.intensity_list,
						}
					this.message =
						`Intensity Report\n${data.time.toLocaleString()}\n\n${data.intensity_list.map(intensity => `震度${intensity.intensity} ${intensity.region_list.join(" ")}`).join("\n")}`;
				}
        this.returnResponse(res, "ok");
        if (this.message) {
          this.ai.post({
            visibility: "home",
            text: this.message,
          });
        }
      } else {
        this.returnResponse(res, "debobigego");
      }
    }).listen(process.env.EARTHQUAKE_PORT || 9999);
  }

  @autobind
  private returnResponse(res: http.ServerResponse, text: string) {
    res.writeHead(200, {
      "Content-Type": "text/plain",
    });
    res.end(text);
  }
}
