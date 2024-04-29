import { getSubjectColor } from '../../src/utils/styles';
import { useGraphContext } from '../../src/context/GraphProvider';

export function GraphPageSubjectsList() {
  const { graph, subjects } = useGraphContext();

  if (!graph) return null;

  return (
    <ul className="absolute left-full top-16 ml-4 flex flex-col text-xs">
      {subjects.map((s) => (
        <li
          key={s}
          className="flex items-center"
          onMouseEnter={() => graph.highlightSubject(s)}
          onMouseLeave={() => graph.highlightSubject(null)}
        >
          <span className="whitespace-nowrap">
            {s}
          </span>
          <span className="ml-1 h-2 w-2 rounded-full" style={{ backgroundColor: getSubjectColor(s) }} />
        </li>
      ))}
    </ul>
  );
}
