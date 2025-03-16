import type { LevelData } from "@/composables/useLevels";
import type { Cell } from "./utils";

export type LevelFetchData = {
  t: string;
  a: string;
  e: string;
  u: string;
  l: string;
}[];

export function decode(data: LevelFetchData, collection: string): LevelData {
  return data.map((item) => ({
    title: item.t,
    author: item.a,
    email: item.e,
    url: item.u,
    collection,
    level: decompressString(item.l)
      .split("|")
      .map((row) => row.split("") as Cell[]),
  }));
}

function decompressString(input: string): string {
  const lines = input.split("|");
  const decompressedLines: string[] = [];

  for (const line of lines) {
    let decompressed = "";
    let i = 0;

    while (i < line.length) {
      let countStr = "";
      while (i < line.length && isDigit(line[i])) {
        countStr += line[i];
        i++;
      }

      if (countStr !== "") {
        const count = parseInt(countStr, 10);
        if (i < line.length) {
          decompressed += line[i].repeat(count);
        }
      } else {
        decompressed += line[i];
      }
      i++;
    }
    decompressedLines.push(decompressed);
  }

  return decompressedLines.join("|");
}

function isDigit(char: string): boolean {
  return char >= "0" && char <= "9";
}