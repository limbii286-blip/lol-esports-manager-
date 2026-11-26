export type NavTab =
  | 'dashboard'
  | 'inbox'
  | 'squad'
  | 'tactics'
  | 'training'
  | 'transfers'
  | 'datahub'
  | 'league'
  | 'club';

export interface ActiveSeriesContext {
  match: any;
  blueTeam: any;
  redTeam: any;
  userSide: 'blue' | 'red';
  bo: number;
  highStakes: boolean;
}
