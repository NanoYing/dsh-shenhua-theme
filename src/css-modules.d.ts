// SPDX-License-Identifier: MPL-2.0
declare module "*.module.css" {
  export function mountStyles(): () => void;
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.svg" {
  const dataUri: string;
  export default dataUri;
}

declare module "*.jpg" {
  const dataUri: string;
  export default dataUri;
}
