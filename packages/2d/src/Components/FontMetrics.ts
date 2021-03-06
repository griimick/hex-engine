import mem from "mem";
import { useType } from "@hex-engine/core";
import { useFilledPixelBounds } from "../Hooks";

export type DrawableFont = {
  readyToDraw(): boolean;
  drawText(
    context: CanvasRenderingContext2D,
    text: string,
    options?: {
      x?: number | undefined;
      y?: number | undefined;
    }
  ): void;
  getFontSize(): number;
  measureWidth(text: string): number;
};

/**
 * This Component measures various characters using the specified font in order to
 * provide a function which can accurately predict the render size of text on the page.
 *
 * It is rarely used directly; instead, use `BMFont` or `SystemFont`.
 */
export default function FontMetrics(impl: DrawableFont) {
  useType(FontMetrics);

  const canvas = document.createElement("canvas");
  canvas.width = impl.getFontSize() * 26;
  canvas.height = impl.getFontSize() * 3;

  const context = canvas.getContext("2d")!;
  if (context == null) {
    throw new Error("Could not get 2d context from canvas");
  }

  function getMetrics() {
    if (!impl.readyToDraw()) {
      return {
        baseline: 0,
        median: 0,
        descender: 0,
        ascender: 0,
        capHeight: 0,
        ascent: 0,
        height: 0,
      };
    }

    context.fillStyle = "black";
    const size = impl.getFontSize();

    impl.drawText(context, "acemnorsuvwxz", { x: 0, y: size });
    const lowercases = useFilledPixelBounds(context);
    const baseline = lowercases.maxY;
    const median = lowercases.minY;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    impl.drawText(context, "gjypq", { x: 0, y: size });
    const tails = useFilledPixelBounds(context);
    const descender = tails.maxY;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    impl.drawText(context, "fhijklt", { x: 0, y: size });
    const ascenders = useFilledPixelBounds(context);
    const ascender = ascenders.minY;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    impl.drawText(context, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", {
      x: 0,
      y: size,
    });
    const caps = useFilledPixelBounds(context);
    const capHeight = caps.minY;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    const ascent = Math.min(ascender, capHeight);

    return {
      baseline: baseline - ascent,
      median: baseline - median,
      descender: descender - baseline,
      ascender: baseline - ascender,
      capHeight: baseline - capHeight,
      ascent: baseline - ascent,
      height: descender - ascent,
      lineHeight: size * 1.25,
    };
  }

  return {
    measureText: mem(
      (text: string) => {
        if (!impl.readyToDraw()) {
          return {
            baseline: 0,
            median: 0,
            descender: 0,
            ascender: 0,
            capHeight: 0,
            ascent: 0,
            height: 0,
            width: 0,
          };
        }

        const width = impl.measureWidth(text);
        const metrics = getMetrics();

        return {
          ...metrics,
          width,
        };
      },
      {
        cacheKey: (args) => {
          return `${impl.readyToDraw()}${impl.getFontSize()}${args[0]}`;
        },
      }
    ),
  };
}
