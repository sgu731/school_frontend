import useWiki from '../../api/useWiki';
import Skeleton from '../Skeleton';

export default function WikiTab({ subjectName }) {
  const { data, isLoading } = useWiki(subjectName);

  if (isLoading) return <Skeleton />;
  if (!data) return <p className="text-sm">查無維基條目</p>;

  return (
    <div className="space-y-2 text-sm leading-6">
      <a
        href={data.url}
        target="_blank"
        rel="noreferrer"
        className="font-semibold underline"
      >
        {data.title}
      </a>
      <p>{data.extract}</p>
    </div>
  );
}
