import { useSocialInfoForm } from "@app/componentlib";
import {
  AuthRestrict,
  FourOhFour,
  FramedAvatarUpload,
  SharedLayout,
} from "@app/components";
import {
  Friends_UserEdgeFragment,
  Friends_UserFragment,
  SharedLayout_UserFragment,
  useAcceptFriendRequestMutation,
  useCreateFriendRequestMutation,
  useDeleteFriendRequestMutation,
  useFriendsQuery,
  useReceivedFriendRequestsQuery,
  useSentFriendRequestsQuery,
  useSharedQuery,
  useUnfriendMutation,
  useUserSearchQuery,
} from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import * as Collapsible from "@radix-ui/react-collapsible";
import * as Tabs from "@radix-ui/react-tabs";
import { Alert, Button, InputRef, Row, Spin } from "antd";
import clsx from "clsx";
import { Formik } from "formik";
import { Form, Input, SubmitButton } from "formik-antd";
import { keyBy } from "lodash";
import { NextPage } from "next";
import * as React from "react";
import { FC, useCallback, useEffect, useRef, useState } from "react";

enum Tab {
  BASIC = "basic info",
  DETAILED = "detailed info",
}

const Account: NextPage = () => {
  const query = useSharedQuery();
  const refetch = async () => query.refetch();
  const [selectedTab, setSelectedTab] = useState<Tab>(Tab.BASIC);
  const [requestsPanelOpen, setRequestsPanelOpen] = useState(false);

  const currentUser = query.data?.currentUser;
  const currentUserId = currentUser?.id as string | undefined;

  if (query.loading) {
    return <p>Loading...</p>;
  }
  if (!currentUser || !currentUserId) {
    return (
      <SharedLayout
        title="account"
        query={query}
        useLightBlueFrame
        forbidWhen={AuthRestrict.LOGGED_OUT}
      >
        <FourOhFour currentUser={query.data?.currentUser} />
      </SharedLayout>
    );
  }

  return (
    <SharedLayout
      title="account"
      query={query}
      useLightBlueFrame
      forbidWhen={AuthRestrict.LOGGED_OUT}
    >
      <div className="ml-[10px] flex h-[125px] w-[220px] items-center justify-center py-10">
        <span className="font-poppins text-[30px] font-semibold">Account</span>
      </div>
      <Tabs.Root
        value={selectedTab}
        onValueChange={(newValue) => {
          setSelectedTab(newValue as Tab);
        }}
        style={{ display: "flex", height: "calc(100vh - 96px - 125px)" }}
      >
        <Tabs.List>
          <div className="mt-[10px] flex w-[220px] flex-col">
            <Tabs.Trigger key={Tab.BASIC} value={Tab.BASIC} asChild>
              <Button className="friends-tab h-[50px] w-full rounded-r-full">
                <span className="font-poppins text-[20px] font-semibold">
                  기본 정보
                </span>
              </Button>
            </Tabs.Trigger>
            <Tabs.Trigger key={Tab.DETAILED} value={Tab.DETAILED} asChild>
              <Button className="friends-tab h-[50px] w-full rounded-r-full">
                <span className="font-poppins text-[20px] font-semibold">
                  세부 정보
                </span>
              </Button>
            </Tabs.Trigger>
          </div>
        </Tabs.List>
        <div className="mb-5 ml-10 w-[calc(100vw-280px)] rounded-[30px] bg-white">
          <Tabs.Content
            key={Tab.BASIC}
            value={Tab.BASIC}
            className="flex h-full w-full flex-col"
          >
            <div className="border-pupcleLightLightGray flex h-[91px] w-full flex-row items-center justify-start border-b-[9px] px-[65px]">
              <span className="font-poppins mt-[2px] text-[24px] font-semibold">
                기본 정보
              </span>
            </div>
            <div className="flex h-[calc(100%-91px)] w-full items-center justify-center">
              {query.data?.currentUser && (
                <AccountBasicPageInner
                  refetch={refetch}
                  currentUser={currentUser}
                />
              )}
            </div>
          </Tabs.Content>
          <Tabs.Content
            key={Tab.DETAILED}
            value={Tab.DETAILED}
            className="flex h-full w-full"
          >
            <div className="border-pupcleLightLightGray flex h-[91px] w-full flex-row items-center justify-start border-b-[9px] px-[65px]">
              <span className="font-poppins mt-[2px] text-[24px] font-semibold">
                세부 정보
              </span>
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </SharedLayout>
  );
};

interface AccountBasicPageInnerProps {
  currentUser: SharedLayout_UserFragment;
  refetch: () => Promise<any>;
}

const AccountBasicPageInner: FC<AccountBasicPageInnerProps> = ({
  currentUser,
}) => {
  const [editingBasicInfo, setEditingBasicInfo] = useState(false);

  const postResult = useCallback(async () => {
    setEditingBasicInfo(false);
  }, []);

  const { submitLabel, validationSchema, initialValues, handleSubmit, error } =
    useSocialInfoForm(
      currentUser.id,
      postResult,
      currentUser.nickname,
      currentUser.username,
      currentUser.avatarUrl
    );

  const focusElement = useRef<InputRef>(null);
  useEffect(
    () => void (focusElement.current && focusElement.current!.focus()),
    [focusElement]
  );

  const code = getCodeFromError(error);

  return (
    <>
      <div className="w-1/2">
        <Formik
          validationSchema={validationSchema}
          initialValues={initialValues}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="flex h-full w-full">
              <div className="relative flex h-full w-full flex-col items-center justify-center px-10 pt-6">
                {editingBasicInfo ? (
                  <Form.Item
                    name="_submit"
                    className="absolute -top-5 -right-5 mb-0"
                  >
                    <SubmitButton
                      className={clsx(
                        "account-submit-button bg-pupcleBlue h-[63px] w-[179px] rounded-[30px] border-2 border-none"
                      )}
                      onClick={() => setEditingBasicInfo(true)}
                    >
                      <span className="font-poppins text-[20px] font-semibold text-white">
                        저장하기
                      </span>
                    </SubmitButton>
                  </Form.Item>
                ) : (
                  <Button
                    className={clsx(
                      "account-edit-button border-pupcleBlue absolute -top-5 -right-5 h-[63px] w-[179px] rounded-[30px] border-2 bg-transparent",
                      {
                        invisible: editingBasicInfo,
                      }
                    )}
                    onClick={() => setEditingBasicInfo(true)}
                  >
                    <span className="text-pupcleBlue font-poppins text-[20px] font-semibold">
                      프로필 수정
                    </span>
                  </Button>
                )}

                <Form.Item
                  name="avatarUrl"
                  valuePropName="avatarUrl"
                  trigger="onUpload"
                  className="mb-0"
                >
                  <FramedAvatarUpload
                    size={"small"}
                    disabled={!editingBasicInfo}
                    avatarUrl={values.avatarUrl}
                    onUpload={async (avatarUrl) =>
                      setFieldValue("avatarUrl", avatarUrl)
                    }
                  />
                </Form.Item>
                <div className="mt-10 flex w-full flex-col">
                  <span className="font-poppins mb-1 pl-6 text-[20px]">
                    Nickname
                  </span>
                  <Form.Item name="nickname">
                    <Input
                      className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-12 w-full rounded-full border-none px-6 text-[16px]"
                      name="nickname"
                      autoComplete="nickname name"
                      ref={focusElement}
                      data-cy="registerpage-input-name"
                      placeholder="닉네임을 입력하세요"
                      suffix
                      disabled={!editingBasicInfo}
                    />
                  </Form.Item>
                </div>
                <div className="flex w-full flex-col">
                  <span className="font-poppins mb-1 pl-6 text-[20px]">ID</span>
                  <Form.Item name="username">
                    <Input
                      className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-12 w-full rounded-full border-none px-6 text-[16px]"
                      name="username"
                      autoComplete="username"
                      ref={focusElement}
                      data-cy="registerpage-input-username"
                      placeholder="ID를 입력하세요(‘_’, ’.’ 제외한 특수문자 불가)"
                      suffix
                      disabled={!editingBasicInfo}
                    />
                  </Form.Item>
                </div>
                {error ? (
                  <Form.Item name="_error">
                    <Alert
                      type="error"
                      message={`Registration failed`}
                      description={
                        <span>
                          {extractError(error).message}
                          {code ? (
                            <span>
                              {" "}
                              (Error code: <code>ERR_{code}</code>)
                            </span>
                          ) : null}
                        </span>
                      }
                    />
                  </Form.Item>
                ) : null}
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </>
  );
};

export default Account;
