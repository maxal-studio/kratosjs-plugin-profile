import {
  Plugin,
  Panel,
  KratosRequest,
  KratosReply,
  adminRoute,
} from "@maxal_studio/kratosjs";
import { ProfilePage } from "./ProfilePage";
import {
  updateProfile,
  changePassword,
  viewProfile,
} from "./profileController";
import { setProfileConfig, ProfilePluginOptions } from "./config";
import en from "./lang/en";
import sq from "./lang/sq";

/**
 * Profile Plugin — a profile page where the logged-in user can edit their
 * details and change their password. Works against the host app's user
 * entity (configurable, defaults to 'User') on both MongoDB and SQL drivers.
 */
export class ProfilePlugin extends Plugin {
  constructor(private readonly options: ProfilePluginOptions = {}) {
    super();
  }

  getName(): string {
    return "profile";
  }

  register(panel: Panel): void {
    setProfileConfig({
      userEntity: this.options.userEntity ?? "User",
      driver: panel.getDriverKind(),
    });

    panel.registerTranslations("profile", { en, sq });

    panel.registerPage(ProfilePage);
    panel.registerCustomBlock("profile-editor");

    const attachPanel = (
      handler: (req: KratosRequest, res: KratosReply) => Promise<void>,
    ) => {
      return async (req: KratosRequest, res: KratosReply) => {
        req.panel = panel;
        await handler(req, res);
      };
    };

    // `adminRoute` prepends the panel's base path and requires auth. It is required:
    // without it `route()` registers a bare, public, top-level path, which would expose
    // profile reads and let anyone change a password unauthenticated.
    panel.route("get", "/profile", adminRoute(panel), attachPanel(viewProfile));
    panel.route(
      "post",
      "/profile/update",
      adminRoute(panel),
      attachPanel(updateProfile),
    );
    panel.route(
      "post",
      "/profile/change-password",
      adminRoute(panel),
      attachPanel(changePassword),
    );
  }
}
