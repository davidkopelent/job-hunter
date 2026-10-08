import Markdown from "react-markdown";

// Descriptions are Markdown converted from the listing's HTML. Headings are demoted: the page owns h1/h2.
export function JobDescription({ markdown }: { markdown: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/85 [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-5">
      <Markdown
        components={{
          h1: Heading,
          h2: Heading,
          h3: Heading,
          h4: Heading,
          h5: Heading,
          h6: Heading,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer" className="text-link hover:underline">
              {children}
            </a>
          ),
        }}
      >
        {markdown}
      </Markdown>
    </div>
  );
}

function Heading({ children }: { children?: React.ReactNode }) {
  return <h3 className="pt-2 text-base font-semibold text-foreground">{children}</h3>;
}
