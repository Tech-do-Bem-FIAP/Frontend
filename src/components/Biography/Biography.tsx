import { FaGithub, FaLinkedin } from "react-icons/fa";
import { GraduationCap } from "lucide-react";

interface BiographyProps {
  src: string;
  alt: string;
  aluno: string;
  rm: number;
  turma: string;
  desc: string;
  linkedin: string;
  github: string;
}

export const Biography = ({
  src,
  alt,
  aluno,
  rm,
  turma,
  desc,
  linkedin,
  github,
}: BiographyProps) => {
  return (
    <section className="mb-6 bg-white border border-gray-200 border-l-4 border-l-(--brand-primary) rounded-xl shadow-sm hover:shadow-md hover:border-l-(--brand-secondary) transition-all p-6 flex flex-col sm:flex-row gap-6">
      <div className="shrink-0 flex sm:block justify-center">
        <img
          className="w-32 h-32 rounded-full object-cover border-2 border-(--brand-primary) shadow-sm"
          src={src}
          alt={alt}
        />
      </div>
      <div className="flex-1">
        <h2 className="title3 mb-1">{aluno}</h2>
        <p className="text-xs text-(--text-secondary-color) mb-4 inline-flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" />
          FIAP · RM {rm} · {turma}
        </p>
        <p className="text-base text-(--text-color) leading-relaxed mb-5">
          {desc}
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-(--brand-primary)/30 text-(--brand-secondary) hover:bg-(--brand-tertiary) transition-colors"
          >
            <FaLinkedin className="w-4 h-4" />
            LinkedIn
          </a>
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-(--brand-primary)/30 text-(--brand-secondary) hover:bg-(--brand-tertiary) transition-colors"
          >
            <FaGithub className="w-4 h-4" />
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
};
