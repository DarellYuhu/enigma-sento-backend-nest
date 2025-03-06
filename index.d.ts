type JwtPayload = {
  sub: string;
  role: string;
  name: string;
  iat: number;
  exp: number;
};

type Section = {
  texts: string[];
  textColor: string;
  textBgColor: string;
  textStroke: string;
  textPosition: 'random' | 'middle' | 'bottom';
  images: string[];
};

type CollectionType =
  | 'MUSIC'
  | 'COLOR'
  | 'FONT'
  | 'REP-IMAGE'
  | 'REP-VIDEO'
  | 'REP-BANNER';

type GeneratorConfig = {
  sections: Section;
  captions: string[];
  hashtags: string;
  sounds: string[];
  groupDistribution: { amountOfTroops: string; path: string }[];
  basePath: string;
};
