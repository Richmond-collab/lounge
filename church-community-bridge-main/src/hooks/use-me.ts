import { useRouteContext } from "@tanstack/react-router";

export function useMe() {
  return useRouteContext({ from: "/_authenticated" }).user;
}
