export * from "./oas"
import {parseFromUrl} from "@asyncapi/parser"
import { OAS } from "./oas";
(async () => {
    const spec = OAS.from(await parseFromUrl('https://gist.githubusercontent.com/mathis-m/8b43f96678dd405823faf88f59b306d5/raw/ceec4787644cee5974d4886a597b636c7754decb/L4n26H9Wg3.txt'));
    const s = JSON.stringify(spec);
    console.log(s)
})()
