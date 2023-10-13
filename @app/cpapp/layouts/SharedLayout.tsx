import { ApolloError, QueryResult, useApolloClient } from "@apollo/client";
import { companyName, projectName } from "@app/config";
import { ErrorAlert } from "@app/cpapp/components/ErrorAlert";
import { Redirect } from "@app/cpapp/components/Redirect";
import { Warn } from "@app/cpapp/components/Warn";
import { Row } from "@app/cpapp/design/layout";
import { Text } from "@app/cpapp/design/typography";
import { View } from "@app/cpapp/design/view";
import {
  SharedLayout_QueryFragment,
  SharedLayout_UserFragment,
  useCurrentUserUpdatedSubscription,
  useLogoutMutation,
} from "@app/graphql";
import accountIcon from "@app/server/public/account_icon.png";
import friendsIcon from "@app/server/public/friends_icon.png";
import hamburger from "@app/server/public/hamburger.png";
import logo from "@app/server/public/logo.png";
import notesIcon from "@app/server/public/notes_icon.png";
import notificationIcon from "@app/server/public/notification_icon.png";
import settingsIcon from "@app/server/public/settings_icon.png";
import clsx from "clsx";
import * as React from "react";
import { useCallback } from "react";
import { SolitoImage } from "solito/image";
import { Link } from "solito/link";
import { usePathname, useRouter } from "solito/navigation";
import { Button } from "tamagui";
import * as DropdownMenu from "zeego/dropdown-menu";

// export const contentMinHeight = "calc(100vh - 6rem)";

// replace Col with View for now
const Col = View;

export interface SharedLayoutChildProps {
  error?: ApolloError | Error;
  loading: boolean;
  currentUser?: SharedLayout_UserFragment | null;
}

export enum AuthRestrict {
  NEVER = 0,
  LOGGED_OUT = 1 << 0,
  LOGGED_IN = 1 << 1,
  NOT_ADMIN = 1 << 2,
}

export interface SharedLayoutProps {
  /*
   * We're expecting lots of different queries to be passed through here, and
   * for them to have this common required data we need. Methods like
   * `subscribeToMore` are too specific (and we don't need them) so we're going
   * to drop them from the data requirements.
   *
   * NOTE: we're not fetching this query internally because we want the entire
   * page to be fetchable via a single GraphQL query, rather than multiple
   * chained queries.
   */
  query: Pick<
    QueryResult<SharedLayout_QueryFragment>,
    "data" | "loading" | "error" | "networkStatus" | "client" | "refetch"
  >;

  title: string;
  titleHref?: string;
  titleHrefAs?: string;
  children:
    | React.ReactNode
    | ((props: SharedLayoutChildProps) => React.ReactNode);
  noPad?: boolean;
  noHandleErrors?: boolean;
  forbidWhen?: AuthRestrict;
  useLightBlueFrame?: boolean;
}

/* The Apollo `useSubscription` hook doesn't currently allow skipping the
 * subscription; we only want it when the user is logged in, so we conditionally
 * call this stub component.
 */
function CurrentUserUpdatedSubscription() {
  /*
   * This will set up a GraphQL subscription monitoring for changes to the
   * current user. Interestingly we don't need to actually _do_ anything - no
   * rendering or similar - because the payload of this mutation will
   * automatically update Apollo's cache which will cause the data to be
   * re-rendered wherever appropriate.
   */
  useCurrentUserUpdatedSubscription();
  return null;
}

export function SharedLayout({
  title,
  // titleHref,
  // titleHrefAs,
  noPad: _noPad = false,
  noHandleErrors = false,
  query,
  forbidWhen = AuthRestrict.NEVER,
  children,
  useLightBlueFrame,
}: SharedLayoutProps) {
  const router = useRouter();
  const currentUrl = usePathname() ?? "/";
  const client = useApolloClient();
  const [logout] = useLogoutMutation();
  const handleLogout = useCallback(() => {
    const _reset = async () => {
      // Router.events.off("routeChangeComplete", reset);
      try {
        await logout();
        client.resetStore();
      } catch (e: any) {
        console.error(e);
        // Something went wrong; redirect to /logout to force logout.
        router.replace("/logout");
      }
    };
    // Router.events.on("routeChangeComplete", reset);
    router.push("/");
  }, [client, logout, router]);
  const forbidsLoggedIn = forbidWhen & AuthRestrict.LOGGED_IN;
  const forbidsLoggedOut = forbidWhen & AuthRestrict.LOGGED_OUT;
  const forbidsNotAdmin = forbidWhen & AuthRestrict.NOT_ADMIN;
  const renderChildren = (props: SharedLayoutChildProps) => {
    const inner =
      props.error && !props.loading && !noHandleErrors ? (
        <>
          {process.env.NODE_ENV === "development" ? (
            <ErrorAlert error={props.error} />
          ) : null}
        </>
      ) : typeof children === "function" ? (
        children(props)
      ) : (
        children
      );
    if (
      data &&
      data.currentUser &&
      (forbidsLoggedIn || (forbidsNotAdmin && !data.currentUser.isAdmin))
    ) {
      return (
        // <StandardWidth>
        <Redirect href={"/"} />
        // </StandardWidth>
      );
    }
    if (
      data?.currentUser &&
      !data.currentUser.nickname &&
      !currentUrl.startsWith("/onboarding/")
    ) {
      // user must set a nickname
      return (
        <Redirect
          href={`/onboarding/social-info?next=${encodeURIComponent(
            currentUrl
          )}`}
        />
      );
    }
    if (
      data?.currentUser &&
      !(data.currentUser.pets.totalCount > 0) &&
      !currentUrl.startsWith("/onboarding/")
    ) {
      // user must add a pet
      return (
        <Redirect
          href={`/onboarding/pet-profile?next=${encodeURIComponent(
            currentUrl
          )}`}
        />
      );
    }
    if (
      data &&
      data.currentUser === null &&
      !loading &&
      !error &&
      forbidsLoggedOut
    ) {
      return (
        <Redirect href={`/login?next=${encodeURIComponent(currentUrl)}`} />
      );
    }

    // return noPad ? (
    //   inner
    // ) : (
    //   <StandardWidth
    //     className={clsx({ "h-[calc(100vh-6rem)]": useLightBlueFrame })}
    //   >
    //     {inner}
    //   </StandardWidth>
    // );
    return inner;
  };
  const { data, loading, error } = query;

  const isMapsPage = currentUrl.startsWith("/maps");

  const firstPet = data?.currentUser?.pets.nodes[0];

  const headerContent: React.ReactNode = (
    <Row
      className="flex h-[96] items-center"
      // style={{
      //   display: "flex",
      //   height: "6rem",
      //   alignItems: "center",
      //   width: isMapsPage ? "100%" : undefined,
      //   minWidth: isMapsPage ? "768px" : undefined,
      // }}
    >
      <Col
        // span={5}
        style={{ display: "flex", justifyContent: "flex-start" }}
      >
        <Link href="/">
          {/* <Link href="/{projectName}"> */}
          <SolitoImage
            src={logo}
            // style={{ height: "min(2.8rem, 4vw)", minHeight: "2rem" }}
            alt="home"
            fill
          />
        </Link>
      </Col>
      <Col
        className="homepage-title"
        // span={15}
      >
        {data?.currentUser && (
          <>
            <Link
              href="/home"
              style={{
                fontWeight: title === "home" ? 600 : 400,
              }}
            >
              <Text>HOME</Text>
            </Link>
            <Link
              href="/calendar"
              style={{
                fontWeight: title === "calendar" ? 600 : 400,
              }}
            >
              <Text>CALENDAR</Text>
            </Link>
            <Link
              href="/mission"
              style={{
                fontWeight: title === "mission" ? 600 : 400,
              }}
            >
              <Text>MISSION</Text>
            </Link>
            <Link
              href="/maps"
              style={{
                fontWeight: title === "maps" ? 600 : 400,
              }}
            >
              <Text>MAPS</Text>
            </Link>
            <Link
              href="/circle"
              style={{
                fontWeight: title === "circle" ? 600 : 400,
              }}
            >
              <Text>CIRCLE</Text>
            </Link>
          </>
        )}
      </Col>
      <Col
        // span={4}
        style={{ display: "flex", justifyContent: "flex-end" }}
      >
        {data && data.currentUser ? (
          <View style={{ display: "flex", alignItems: "center" }}>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <View
                  data-cy="layout-dropdown-user"
                  style={{
                    // whiteSpace: "nowrap",
                    // marginRight: "min(24px, calc(8px + 1.5vw))",
                    position: "relative",
                    // top: "min(calc(0.5vw + 5px), 18px)",
                  }}
                >
                  {/* <Warn okay={false} data-cy="header-unverified-warning"> */}
                  <SolitoImage
                    src={hamburger}
                    // style={{
                    //   height: "min(2rem, 4vw)",
                    //   minHeight: "1.5rem",
                    // }}
                    alt="menu"
                    fill
                  />
                  {/* </Warn> */}

                  {/* <Avatar>
              {(data.currentUser.name && data.currentUser.name[0]) ||
                "?"}
            </Avatar> */}
                </View>
              </DropdownMenu.Trigger>

              <DropdownMenu.Content
                style={{
                  display: "flex",
                  flexDirection: "column",
                  // width: "245px",
                  // height: "250px",
                  // right: "-80px",
                  // top: "-20px",
                  // borderRadius: "30px",
                  padding: 0,
                  // boxShadow: "0px 0px 6px 2px rgb(0 0 0 / 0.25)",
                }}
              >
                {/* {data.currentUser.organizationMemberships.nodes.map(
                    ({ organization, isOwner }) => (
                      <Menu.Item key={organization?.id}>
                        <Link
                          href={`/o/[slug]`}
                          as={`/o/${organization?.slug}`}
                        >
                          {organization?.name}
                          {isOwner ? (
                            <span>
                              {" "}
                              <CrownOutlined />
                            </span>
                          ) : (
                            ""
                          )}
                        </Link>
                      </Menu.Item>
                    )
                  )} */}
                <DropdownMenu.Item
                  key="_account"
                  // style={{
                  //   height: "calc((250px - 147px) / 2)",
                  //   padding: "2.5px 1.5rem 0px",
                  //   borderBottom: "#D9D9D9 2px solid",
                  // }}
                  textValue="Account"
                >
                  <Link href="/account" data-cy="layout-link-account">
                    <Row style={{ alignItems: "center" }}>
                      <Col
                        // span={4}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <SolitoImage
                          src={accountIcon}
                          style={{ width: 17 }}
                          fill
                          alt="account"
                        />
                      </Col>
                      <Col
                      // span={20}
                      // style={{ paddingLeft: "0.5rem" }}
                      >
                        <DropdownMenu.ItemTitle
                          style={{
                            fontFamily: "Poppins",
                            // fontSize: "14px",
                            fontWeight: "400",
                          }}
                        >
                          Account
                        </DropdownMenu.ItemTitle>
                      </Col>
                    </Row>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  key="_pup-notes"
                  style={
                    {
                      // height: "49px",
                      // padding: "0 1.5rem",
                      // borderBottom: "#D9D9D9 2px solid",
                    }
                  }
                  textValue="My Pup's Notes"
                >
                  <Link
                    href={`/pup-notes/${firstPet?.id}`}
                    data-cy="layout-link-pup-notes"
                  >
                    <Row style={{ alignItems: "center" }}>
                      <Col
                        // span={4}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <SolitoImage
                          src={notesIcon}
                          // style={{ width: "20px" }}
                          fill
                          alt="notes"
                        />
                      </Col>
                      <Col
                      // span={20}
                      // style={{ paddingLeft: "0.5rem" }}
                      >
                        <DropdownMenu.ItemTitle
                          style={{
                            fontFamily: "Poppins",
                            // fontSize: "14px",
                            fontWeight: "400",
                          }}
                        >
                          My Pup&apos;s Notes
                        </DropdownMenu.ItemTitle>
                      </Col>
                    </Row>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  key="_friends"
                  // style={{
                  //   height: "49px",
                  //   padding: "0 1.5rem",
                  //   borderBottom: "#D9D9D9 2px solid",
                  // }}
                  textValue="Friends"
                >
                  <Link href="/friends" data-cy="layout-link-friends">
                    <Row style={{ alignItems: "center" }}>
                      <Col
                        // span={4}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <SolitoImage
                          src={friendsIcon}
                          style={{ width: 24 }}
                          fill
                          alt="friends"
                        />
                      </Col>
                      <Col
                      // span={20}
                      // style={{ paddingLeft: "0.5rem" }}
                      >
                        <DropdownMenu.ItemTitle
                          style={{
                            fontFamily: "Poppins",
                            // fontSize: "14px",
                            fontWeight: "400",
                          }}
                        >
                          Friends
                        </DropdownMenu.ItemTitle>
                      </Col>
                    </Row>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  key="_settings"
                  // style={{
                  //   height: "49px",
                  //   padding: "0 1.5rem",
                  //   borderBottom: "#D9D9D9 2px solid",
                  // }}
                  textValue="Settings"
                >
                  <Link href="/settings" data-cy="layout-link-settings">
                    <Row style={{ alignItems: "center" }}>
                      <Col
                        // span={4}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <SolitoImage
                          src={settingsIcon}
                          style={{ width: 23 }}
                          fill
                          alt="settings"
                        />
                      </Col>
                      <Col
                      // span={20}
                      // style={{ paddingLeft: "0.5rem" }}
                      >
                        <Warn okay={true}>
                          <DropdownMenu.ItemTitle
                            style={{
                              fontFamily: "Poppins",
                              // fontSize: "14px",
                              fontWeight: "400",
                            }}
                          >
                            Settings
                          </DropdownMenu.ItemTitle>
                        </Warn>
                      </Col>
                    </Row>
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  key="_notification"
                  // style={{
                  //   height: "calc((250px - 147px) / 2)",
                  //   padding: "0 1.5rem 2.5px",
                  // }}
                  textValue="Notifications"
                >
                  <Link href="/notification" data-cy="layout-link-notification">
                    <Row style={{ alignItems: "center" }}>
                      <Col
                        // span={4}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <SolitoImage
                          src={notificationIcon}
                          style={{ width: 28 }}
                          fill
                          alt="notification"
                        />
                      </Col>
                      <Col
                      // span={20}
                      // style={{ paddingLeft: "0.5rem" }}
                      >
                        <DropdownMenu.ItemTitle
                          style={{
                            fontFamily: "Poppins",
                            // fontSize: "14px",
                            fontWeight: "400",
                          }}
                        >
                          Notification
                        </DropdownMenu.ItemTitle>
                      </Col>
                    </Row>
                  </Link>
                </DropdownMenu.Item>
                {/* <DropdownMenu.Item key="_logout">
                  <a onClick={handleLogout}>Logout</a>
                </DropdownMenu.Item> */}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
            {/* TODO: add the other menu */}
          </View>
        ) : forbidsLoggedIn ? null : (
          <Button
            href={`/login?next=${encodeURIComponent(currentUrl)}`}
            style={{
              display: "flex",
              // height: "min(40px, 2rem + 0.5vw)",
              // width: "min(106px, 80px + 2vw)",
              // alignItems: "center",
              // backgroundColor: "#7FB3E8", // TODO: pupcleBlue로 컬러 정의 후 사용(계속 사용할 것 같음)
              // borderRadius: "20px",
              // borderStyle: "none",
              // color: "white",
              // justifyContent: "center",
              // fontFamily: "Poppins, sans-serif",
              // fontSize: "min(20px, 14px + 0.5vw)",
              // fontWeight: 500,
            }}
          >
            Login
          </Button>
        )}
      </Col>
    </Row>
  );

  return (
    <View
      className={clsx({
        "bg-pupcleLightBlue": useLightBlueFrame,
        "md:min-w-[768px]": !isMapsPage,
      })}
    >
      {data && data.currentUser ? <CurrentUserUpdatedSubscription /> : null}
      {title === "Sign in" || title === "Register" ? null : (
        // was antd header
        <View
        // style={{
        //   boxShadow: "0px 4px 4px rgb(0 0 0 / 0.25)", // TODO: f5f5f5 -> pupcleGray로 지정
        //   zIndex: 2,
        //   overflow: "hidden",
        //   height: "6rem",
        //   borderRadius: "0 0 50px 50px",
        //   border: "solid 2px #f5f5f5",
        // }}
        >
          {/* <Head>
            <title>{title ? `${title} — ${projectName}` : projectName}</title>
          </Head> */}
          {isMapsPage ? (
            <View
            // style={{
            //   overflowX: "scroll",
            // }}
            >
              {headerContent}
            </View>
          ) : (
            headerContent
          )}
        </View>
      )}

      {/* was antd Content */}
      <View
      // style={{ minHeight: contentMinHeight }}
      >
        {renderChildren({
          error,
          loading,
          currentUser: data && data.currentUser,
        })}
      </View>
    </View>
  );
}
