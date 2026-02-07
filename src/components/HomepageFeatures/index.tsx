import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Project-first workflow',
    Svg: require('@site/static/img/undraw_in-the-zone_07y7.svg').default,
    description: (
      <>
        Everything in IndieDesk revolves around projects:
        tasks, clients, expenses and notes in one place.
      </>
    ),
  },
  {
    title: 'Built for indie developers',
    Svg: require('@site/static/img/undraw_mobile-development_tjxm.svg').default,
    description: (
      <>
        A Laravel-based workspace designed for solo devs.
        Clean structure, no bloat, easy to customize.
      </>
    ),
  },
  {
    title: 'Self-hosted & yours',
    Svg: require('@site/static/img/undraw_programming_j1zw.svg').default,
    description: (
      <>
        Run IndieDesk on your own server or locally.
        Your data, your rules. No subscriptions, no lock-in.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
