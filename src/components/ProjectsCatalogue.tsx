"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { editorialProjects } from "@/lib/editorial-projects";
import { projectImages } from "@/lib/project-images";
import "@/app/project-experience.css";

export function ProjectsCatalogue({ slugs, investmentMode = false }: {
  slugs?: string[];
  investmentMode?: boolean;
} = {}) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("");
  const [segment, setSegment] = useState("");
  const all = useMemo(
    () => editorialProjects.filter(project => !slugs || slugs.includes(project.slug)),
    [slugs],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase("ru");
  const list = all
    .filter(project =>
      [project.name, project.area, project.developer].join(" ").toLocaleLowerCase("ru").includes(normalizedQuery) &&
      (!area || project.area === area) &&
      (!segment || project.className === segment)
    )
    .sort((a, b) => a.name.localeCompare(b.name, "ru", { numeric: true }));

  return (
    <section className="mh-visual-catalog">
      <div className="mh-visual-filters">
        <input aria-label="Поиск проектов" placeholder="Название, локация или застройщик" value={query} onChange={event => setQuery(event.target.value)} />
        <select aria-label="Локация" value={area} onChange={event => setArea(event.target.value)}>
          <option value="">Все локации</option>
          {[...new Set(all.map(project => project.area))].sort().map(value => <option key={value}>{value}</option>)}
        </select>
        <select aria-label="Класс недвижимости" value={segment} onChange={event => setSegment(event.target.value)}>
          <option value="">Все классы</option>
          {[...new Set(all.map(project => project.className))].map(value => <option key={value}>{value}</option>)}
        </select>
      </div>
      <p className="mh-visual-count" aria-live="polite">{list.length} проектов</p>
      <div className="mh-visual-grid">
        {list.map(project => {
          const photo = projectImages[project.slug];
          return (
            <Link key={project.slug} href={'/projects/' + project.slug + '/'} className={'mh-visual-card' + (investmentMode ? ' mh-invest-selection-card' : '')}>
              <div className="mh-visual-cover">
                {photo
                  ? <img src={photo.src} alt={photo.caption} width="1000" height="750" loading="lazy" />
                  : <span className="mh-visual-cover-placeholder">{project.name}</span>}
                <span className="mh-class-chip">{project.className}</span>
              </div>
              <div className="mh-visual-copy">
                <p>{project.area} · {project.developer}</p>
                <h2>{project.name}</h2>
                <span>Посмотреть проект <b aria-hidden="true">↗</b></span>
              </div>
            </Link>
          );
        })}
      </div>
      {!list.length && <p>По выбранным условиям проектов не найдено.</p>}
    </section>
  );
}
