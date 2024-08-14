import fs from "fs";
import path from "path";
import { SatoriOptions, Font } from "satori";

function readFont(name: string) {
  return fs.readFileSync(path.resolve(`./public/${name}`));
}

export const fonts: Font[] = [
  {
    name: "SpaceGrotesk",
    data: readFont("SpaceGrotesk-Regular.ttf"),
    weight: 400,
    style: "normal",
  },
  {
    name: "SpaceGrotesk",
    data: readFont("SpaceGrotesk-Bold.ttf"),
    weight: 700,
    style: "normal",
  },
  {
    name: "Inter",
    data: readFont("Inter-Regular.ttf"),
    weight: 400,
    style: "normal",
  },
  {
    name: "Inter",
    data: readFont("Inter-Medium.ttf"),
    weight: 500,
    style: "normal",
  },
  {
    name: "Inter",
    data: readFont("Inter-SemiBold.ttf"),
    weight: 600,
    style: "normal",
  },
  {
    name: "Inter",
    data: readFont("Inter-Bold.ttf"),
    weight: 700,
    style: "normal",
  },
];

export const options: SatoriOptions = {
  width: 1200,
  height: 628,
  fonts,
};
