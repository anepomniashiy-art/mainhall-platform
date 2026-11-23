import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Editorial";
import "./districts.css";

export function DistrictHero({
  breadcrumbs,
  title,
  description,
  image,
  children,
}: {
  breadcrumbs: { name: string; href: string }[];
  title: string;
  description: string;
  image: { src: string; caption: string; srcSet?: string };
  children?: ReactNode;
}) {
  return (
    <header className="district-hero">
      <figure className="district-hero-media">
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={image.srcSet ? "100vw" : undefined}
          alt=""
          width="1600"
          height="1000"
          fetchPriority="high"
          decoding="async"
        />
        <figcaption>{image.caption}</figcaption>
      </figure>
      <div className="district-width district-hero-inner">
        <Breadcrumbs items={breadcrumbs} />
        <div className="district-hero-copy">
          <h1>{title}</h1>
          <p>{description}</p>
          {children}
        </div>
      </div>
    </header>
  );
}
