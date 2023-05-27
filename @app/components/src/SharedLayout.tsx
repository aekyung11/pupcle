import { CrownOutlined } from "@ant-design/icons";
import { ApolloError, QueryResult, useApolloClient } from "@apollo/client";
import { companyName, projectName } from "@app/config";
import {
  SharedLayout_QueryFragment,
  SharedLayout_UserFragment,
  useCurrentUserUpdatedSubscription,
  useLogoutMutation,
} from "@app/graphql";
import hamburger from "@app/server/public/hamburger.png";
import logo from "@app/server/public/logo.png";
import { Button, Col, Dropdown, Layout, Menu, Row, Typography } from "antd";
import Head from "next/head";
import Link from "next/link";
import Router, { useRouter } from "next/router";
import * as React from "react";
import { useCallback } from "react";

import { AspectRatioImage, ErrorAlert, StandardWidth, Warn } from ".";
import { Redirect } from "./Redirect";

const { Header, Content, Footer } = Layout;
const { Text } = Typography;
/*
 * For some reason, possibly related to the interaction between
 * `babel-plugin-import` and https://github.com/babel/babel/pull/9766, we can't
 * directly export these values, but if we reference them and re-export then we
 * can.
 *
 * TODO: change back to `export { Row, Col, Link }` when this issue is fixed.
 */
const _babelHackRow = Row;
const _babelHackCol = Col;
export { _babelHackCol as Col, Link, _babelHackRow as Row };

export const contentMinHeight = "calc(100vh - 64px - 70px)";

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
  noPad = false,
  noHandleErrors = false,
  query,
  forbidWhen = AuthRestrict.NEVER,
  children,
}: SharedLayoutProps) {
  const router = useRouter();
  const currentUrl = router.asPath;
  const client = useApolloClient();
  const [logout] = useLogoutMutation();
  const handleLogout = useCallback(() => {
    const reset = async () => {
      Router.events.off("routeChangeComplete", reset);
      try {
        await logout();
        client.resetStore();
      } catch (e: any) {
        console.error(e);
        // Something went wrong; redirect to /logout to force logout.
        window.location.href = "/logout";
      }
    };
    Router.events.on("routeChangeComplete", reset);
    Router.push("/");
  }, [client, logout]);
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
        <StandardWidth>
          <Redirect href={"/"} />
        </StandardWidth>
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
            router.asPath
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
            router.asPath
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
        <Redirect href={`/login?next=${encodeURIComponent(router.asPath)}`} />
      );
    }

    return noPad ? inner : <StandardWidth>{inner}</StandardWidth>;
  };
  const { data, loading, error } = query;

  const isMapsPage = currentUrl.startsWith("/maps");

  const headerContent: React.ReactNode = (
    <Row
      style={{
        display: "flex",
        height: "6rem",
        alignItems: "center",
        width: isMapsPage ? "100%" : undefined,
        minWidth: isMapsPage ? "768px" : undefined,
      }}
    >
      <Col span={5} style={{ display: "flex", justifyContent: "flex-start" }}>
        <Link href="/">
          {/* <Link href="/{projectName}"> */}
          <AspectRatioImage
            style={{
              height: "min(2.8rem, 4vw)",
              minHeight: "2rem",
            }}
            imgWidth={374}
            imgHeight={116}
            alt="home"
            src={logo}
          />
        </Link>
      </Col>
      <Col className="homepage-title" span={15}>
        {data?.currentUser && (
          <>
            <Link
              href="/home"
              style={{
                fontWeight: title === "home" ? 600 : 400,
              }}
            >
              HOME
            </Link>
            <a
              href="/calendar"
              style={{
                fontWeight: title === "calendar" ? 600 : 400,
              }}
            >
              CALENDAR
            </a>
            <Link
              href="/mission"
              style={{
                fontWeight: title === "mission" ? 600 : 400,
              }}
            >
              MISSION
            </Link>
            <Link
              href="/maps"
              style={{
                fontWeight: title === "maps" ? 600 : 400,
              }}
            >
              MAPS
            </Link>
            <Link
              href="/circle"
              style={{
                fontWeight: title === "circle" ? 600 : 400,
              }}
            >
              CIRCLE
            </Link>
          </>
        )}
      </Col>
      <Col span={4} style={{ display: "flex", justifyContent: "flex-end" }}>
        {data && data.currentUser ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Dropdown
              overlay={
                <Menu>
                  {data.currentUser.organizationMemberships.nodes.map(
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
                  )}
                  <Menu.Item key="_account">
                    <Link href="/account" data-cy="layout-link-account">
                      Account
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="_pup-notes">
                    <Link href="/pup-notes" data-cy="layout-link-pup-notes">
                      My Pup&apos;s Notes
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="_friends">
                    <Link href="/friends" data-cy="layout-link-friends">
                      Friends
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="_settings">
                    <Link href="/settings" data-cy="layout-link-settings">
                      <Warn okay={data.currentUser.isVerified}>Settings</Warn>
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="_notification">
                    <Link
                      href="/notification"
                      data-cy="layout-link-notification"
                    >
                      Notification
                    </Link>
                  </Menu.Item>
                  {/* <Menu.Item key="_logout">
                  <a onClick={handleLogout}>Logout</a>
                </Menu.Item> */}
                </Menu>
              }
            >
              <span
                data-cy="layout-dropdown-user"
                style={{
                  whiteSpace: "nowrap",
                  marginRight: "min(24px, calc(8px + 1.5vw))",
                  position: "relative",
                  top: "min(calc(0.5vw + 5px), 18px)",
                }}
              >
                <Warn
                  okay={data.currentUser.isVerified}
                  data-cy="header-unverified-warning"
                >
                  <AspectRatioImage
                    style={{
                      height: "min(2rem, 4vw)",
                      minHeight: "1.5rem",
                    }}
                    alt="menu"
                    src={hamburger}
                    imgWidth={72}
                    imgHeight={72}
                  />
                </Warn>

                {/* <Avatar>
              {(data.currentUser.name && data.currentUser.name[0]) ||
                "?"}
            </Avatar> */}
              </span>
            </Dropdown>
            <Dropdown
              overlay={
                <Menu>
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
                )}
                <Menu.Item key="_create-organization">
                  <Link
                    href="/create-organization"
                    data-cy="layout-link-create-organization"
                  >
                    Create organization
                  </Link>
                </Menu.Item> */}
                  {/* <Menu.Item key="_settings">
                  <Link href="/settings" data-cy="layout-link-settings">
                    <Warn okay={data.currentUser.isVerified}>
                      Settings
                    </Warn>
                  </Link>
                </Menu.Item> */}

                  {/* TODO: show a list of pets, each pet has it's own page */}
                  {data.currentUser.pets.nodes.map((pet) => (
                    <Menu.Item key={pet.id}>
                      <a>{pet.name}</a>
                    </Menu.Item>
                  ))}

                  <Menu.Item key="_logout">
                    <a onClick={handleLogout}>Logout</a>
                  </Menu.Item>
                </Menu>
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  data.currentUser.pets.nodes[0]?.avatarUrl ||
                  data.currentUser.avatarUrl ||
                  "/default_avatar.png"
                }
                style={{
                  height: "min(38px, 4vw)",
                  width: "min(38px, 4vw)",
                  minHeight: "1.8rem",
                  minWidth: "1.8rem",
                  borderRadius: "min(19px, 2vw)",
                  objectFit: "cover",
                }}
                alt="user menu"
              />
            </Dropdown>
          </div>
        ) : forbidsLoggedIn ? null : (
          <Button
            href={`/login?next=${encodeURIComponent(currentUrl)}`}
            style={{
              display: "flex",
              height: "min(40px, 2rem + 0.5vw)",
              width: "min(106px, 80px + 2vw)",
              alignItems: "center",
              backgroundColor: "#7FB3E8", // TODO: pupcleBlue로 컬러 정의 후 사용(계속 사용할 것 같음)
              borderRadius: "20px",
              borderStyle: "none",
              color: "white",
              justifyContent: "center",
              fontFamily: "Poppins, sans-serif",
              fontSize: "min(20px, 14px + 0.5vw)",
              fontWeight: 500,
            }}
          >
            Login
          </Button>
        )}
      </Col>
    </Row>
  );

  return (
    <Layout style={isMapsPage ? {} : { minWidth: "768px" }}>
      {data && data.currentUser ? <CurrentUserUpdatedSubscription /> : null}
      {title === "Sign in" || title === "Register" ? null : (
        <Header
          style={{
            boxShadow: "0px 4px 4px rgb(0 0 0 / 0.25)", // TODO: f5f5f5 -> pupcleGray로 지정
            zIndex: 1,
            overflow: "hidden",
            height: "6rem",
            borderRadius: "0 0 50px 50px",
            border: "solid 2px #f5f5f5",
          }}
        >
          <Head>
            {/* 100: thin, 200: extralight, 300: light, 400: regular, 500: medium, 600: semibold, 700: bold, 800: extrabold */}
            <title>{title ? `${title} — ${projectName}` : projectName}</title>
          </Head>
          {isMapsPage ? (
            <div
              style={{
                overflowX: "scroll",
              }}
            >
              {headerContent}
            </div>
          ) : (
            headerContent
          )}
        </Header>
      )}

      <Content style={{ minHeight: contentMinHeight }}>
        {renderChildren({
          error,
          loading,
          currentUser: data && data.currentUser,
        })}
      </Content>
      {title === "Sign in" || title === "Register" ? null : (
        <Footer>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <Text>
              Copyright &copy; {new Date().getFullYear()} {companyName}. All
              rights reserved.
              {process.env.T_AND_C_URL ? (
                <span>
                  {" "}
                  <a
                    style={{ textDecoration: "underline" }}
                    href={process.env.T_AND_C_URL}
                  >
                    Terms and conditions
                  </a>
                </span>
              ) : null}
            </Text>
            <Text>
              Powered by{" "}
              <a
                style={{ textDecoration: "underline" }}
                href="https://graphile.org/postgraphile"
              >
                PostGraphile
              </a>
            </Text>
          </div>
        </Footer>
      )}
    </Layout>
  );
}
