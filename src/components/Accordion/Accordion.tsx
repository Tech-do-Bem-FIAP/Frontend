import type React from "react";
import { ChevronDown } from "lucide-react";

interface AccordionProps {
  question: string;
  answer: string;
}

export const Accordion = ({
  question,
  answer,
}: AccordionProps): React.JSX.Element => {
  return (
    <details
      name="FAQ"
      className="group w-full p-5 bg-white border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-xl cursor-pointer shadow-sm hover:shadow-md transition-shadow"
    >
      <summary className="text-lg font-medium text-(--brand-secondary) list-none flex justify-between items-center gap-4">
        <span>{question}</span>
        <ChevronDown className="w-5 h-5 text-(--brand-primary) shrink-0 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <p className="text-(--text-color) pt-4 leading-relaxed">{answer}</p>
    </details>
  );
};
