export const colors = {
  paper: "#f3efe4",
  card: "#fffdf8",
  forest: "#1e4d38",
  forestDark: "#143528",
  leaf: "#2f6d4f",
  sand: "#e7d7b1",
  ink: "#1c1915",
  muted: "#5e584e",
  line: "#e4dccb",
  danger: "#8f2d2d",
  dangerBg: "#f8e6e6",
  warning: "#8a5a12",
  warningBg: "#f8efd8",
  info: "#1e4a6d",
  infoBg: "#e7eef6",
  okBg: "#e5f2ea",
};

export const headerOptions = {
  headerStyle: { backgroundColor: colors.paper },
  headerTintColor: colors.forest,
  headerTitleStyle: { fontWeight: "600" as const },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.paper },
};

export function statusColors(status: string) {
  switch (status) {
    case "approved":
      return { background: colors.okBg, text: colors.forest };
    case "submitted":
      return { background: colors.infoBg, text: colors.info };
    case "needs_revision":
      return { background: colors.warningBg, text: colors.warning };
    case "rejected":
      return { background: colors.dangerBg, text: colors.danger };
    default:
      return { background: "#eeeae2", text: colors.muted };
  }
}
