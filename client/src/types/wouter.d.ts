
declare module 'wouter' {
  export function Route(props: { path?: string; component: any }): JSX.Element;
  export function Switch(props: { children: React.ReactNode }): JSX.Element;
  export function useLocation(): [string, (path: string) => void];
  export function useRoute(path: string): [boolean, Record<string, string>];
}
