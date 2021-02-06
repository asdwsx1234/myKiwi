import * as vscode from 'vscode';
import axios from 'axios';
import * as qs from 'querystring';
var crypto = require('crypto');

function translate(text, targetLang) {
  return new Promise(async (resolve, reject) => {
    var md5 = crypto.createHash('md5');

    const { data } = await axios.post(
      `https://fanyi-api.baidu.com/api/trans/vip/translate`,
      qs.stringify({
        q: text,
        from: 'auto',
        to: targetLang,
        appid: '',
        salt: '',
        sign: '',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    const { trans_result } = data;

    if (trans_result) {
      resolve(trans_result[0].dst);
    }
  });
}
/**
 * 更新文件
 * @param arg  目标字符串对象
 * @param val  目标语言
 * @param validateDuplicate 是否校验文件中已经存在要写入的 key
 */
export async function translateAndReplace(arg, val) {
  const edit = new vscode.WorkspaceEdit();
  const { document } = vscode.window.activeTextEditor;
  let text = arg.text;

  if (arg.isString) {
    let startColPostion;
    try {
      startColPostion = arg.range.start.translate(0, -2);
    } catch (e) {
      startColPostion = arg.range.start.translate(0, 0);
    }
    const prevTextRange = new vscode.Range(startColPostion, arg.range.start);
    const [last2Char, last1Char] = document.getText(prevTextRange).split('');
    try {
      let finalReplaceVal = await translate(text, val);

      edit.replace(
        document.uri,
        arg.range.with({
          start: arg.range.start.translate(0, -1),
          end: arg.range.end.translate(0, 1)
        }),
        `'${finalReplaceVal}'`
      );
      return vscode.workspace.applyEdit(edit);
    } catch (e) {
      return Promise.reject(e.message);
    }
  }
}
