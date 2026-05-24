import { useId, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const contentId = useId();

  return (
    <div className="w-full bg-white border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        className="w-full p-5 text-lg font-medium text-(--brand-secondary) flex justify-between items-center gap-4 text-left cursor-pointer"
      >
        <span>{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-(--brand-primary) shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div id={contentId} className="collapsible" data-open={open}>
        <div>
          <p className="px-5 pb-5 text-(--text-color) leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};
