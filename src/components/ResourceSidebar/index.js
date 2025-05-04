import { useState } from 'react';
import WikiTab from './WikiTab';
import LinksTab from './LinksTab';
// import BooksTab from './BooksTab'; // 之後再接

const tabs = [
  { key: 'wiki', label: '維基百科', Comp: WikiTab },
  { key: 'links', label: '相關連結', Comp: LinksTab },
];

export default function ResourceSidebar({ subjectName }) {
  const [active, setActive] = useState('wiki');
  const ActiveComp = tabs.find((t) => t.key === active).Comp;

  return (
    <aside className="w-[320px] border-l pl-4">
      <div className="flex gap-2 mb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={active === t.key ? 'font-bold' : ''}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ActiveComp subjectName={subjectName} />
    </aside>
  );
}
