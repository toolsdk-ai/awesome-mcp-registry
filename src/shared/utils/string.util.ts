/**
 * 字符串工具函数
 */

/**
 * 从字符串中提取最后一个完整的 JSON 对象
 * @param str 输入字符串
 * @returns JSON 字符串
 */
export function extractLastOuterJSON(str: string): string {
  console.log("Extracting JSON from:", str);
  let braceCount = 0;
  let end = -1;
  let start = -1;

  for (let i = str.length - 1; i >= 0; i--) {
    const ch = str[i];

    if (ch === "}") {
      if (end === -1) end = i;
      braceCount++;
    } else if (ch === "{") {
      braceCount--;
      if (braceCount === 0 && end !== -1) {
        start = i;
        break;
      }
    }
  }

  if (start === -1 || end === -1) {
    throw new Error("No valid JSON found in string");
  }

  const jsonStr = str.slice(start, end + 1);
  return jsonStr;
}
