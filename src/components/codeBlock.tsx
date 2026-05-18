import { highlightCode } from "@/lib/highlight";
import { CopyButton } from "@/components/copyButton";

export async function CodeBlock({
  code,
  language,
  caption,
}: {
  code: string;
  language: string;
  caption?: string;
}) {
  const html = await highlightCode(code, language);
  return (
    <figure className="my-5 overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-1.5 text-xs">
        <span className="font-mono uppercase text-muted-foreground">{language}</span>
        <CopyButton text={code} />
      </div>
      <div
        className="shiki-wrapper overflow-x-auto text-[13px] leading-6 [&_pre]:!my-0 [&_pre]:px-4 [&_pre]:py-3"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {caption && (
        <figcaption className="border-t bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
