import { usePrivateInfoForm, useSocialInfoForm } from "@app/componentlib";
import {
  AuthRestrict,
  FourOhFour,
  FramedAvatarUpload,
  SharedLayout,
} from "@app/components";
import {
  SharedLayout_UserEntryFragment,
  SharedLayout_UserFragment,
  useSharedQuery,
} from "@app/graphql";
import { extractError, getCodeFromError } from "@app/lib";
import * as Tabs from "@radix-ui/react-tabs";
import { Alert, Button, InputRef } from "antd";
import clsx from "clsx";
import { Formik } from "formik";
import { Form, Input, SubmitButton } from "formik-antd";
import { NextPage } from "next";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FC, useCallback, useEffect, useRef, useState } from "react";

const Account: NextPage = () => {
  const query = useSharedQuery();
  const refetch = async () => query.refetch();
  // const [selectedTab, setSelectedTab] = useState<Tab>(Tab.Detailed);

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
      <div className="flex h-full w-full flex-col">
        <div className="flex h-[125px] w-[220px] items-center justify-center">
          <span className="font-poppins text-[30px] font-semibold">
            Account
          </span>
        </div>
        <div className="flex h-full w-full justify-center">
          <div className="h-[calc(100vh-6rem-125px)] w-[calc(100vw-280px)] rounded-[30px] bg-white">
            <div className="border-pupcleLightLightGray flex h-[91px] w-full flex-row items-center justify-start border-b-[9px] px-[65px]">
              <Button
                href="/account"
                className="flex h-fit w-fit flex-row items-center border-none bg-transparent p-0 !shadow-none drop-shadow-none"
              >
                <img
                  src="/pup_notes_caret_icon.png"
                  className="h-[13px] w-5 rotate-90"
                />
                <span className="font-poppins ml-4 mt-[2px] text-[24px] font-semibold text-black">
                  세부 정보
                </span>
              </Button>
            </div>
            <div className="flex h-[calc(100%-91px)] w-full justify-center py-10">
              {currentUser && currentUser.userEntry && (
                <AccountDetailedPageInner
                  refetch={refetch}
                  currentUser={currentUser}
                  currentUserEntry={currentUser.userEntry}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
};

interface AccountDetailedPageInnerProps {
  currentUser: SharedLayout_UserFragment;
  currentUserEntry: SharedLayout_UserEntryFragment;
  refetch: () => Promise<any>;
}

const AccountDetailedPageInner: FC<AccountDetailedPageInnerProps> = ({
  currentUserEntry,
}) => {
  const [editingDetailedInfo, setEditingDetailedInfo] = useState(false);

  const postResult = useCallback(async () => {
    setEditingDetailedInfo(false);
  }, []);

  const { validationSchema, initialValues, handleSubmit, error } =
    usePrivateInfoForm(currentUserEntry, postResult);

  const focusElement = useRef<InputRef>(null);
  useEffect(
    () => void (focusElement.current && focusElement.current!.focus()),
    [focusElement]
  );

  const code = getCodeFromError(error);

  return (
    <>
      <div className="w-1/2 overflow-scroll">
        <Formik
          validationSchema={validationSchema}
          initialValues={initialValues}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="flex w-full">
              <div className="relative flex w-full flex-col items-center justify-center px-10 pt-6">
                <div className="flex w-full flex-col">
                  <span className="font-poppins mb-1 pl-6 text-[20px]">
                    이름
                  </span>
                  <Form.Item name="name">
                    <Input
                      className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-12 w-full rounded-full border-none px-6 text-[16px]"
                      name="name"
                      autoComplete="name"
                      ref={focusElement}
                      data-cy="detailed-info-page-input-name"
                      placeholder="실명을 입력하세요"
                      suffix
                      disabled={!editingDetailedInfo}
                    />
                  </Form.Item>
                </div>
                {/* <div className="flex w-full flex-col">
                  <span className="font-poppins mb-1 pl-6 text-[20px]">
                    이메일 주소
                  </span>
                  <Dialog.Root>
                    <Dialog.Trigger asChild>
                      <Button className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray mb-6 h-12 w-full rounded-full border-none px-6 text-[16px]">
                        <Form.Item name="email" className="mb-0">
                          <Input
                            className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-full w-full rounded-full border-none p-0 text-[16px]"
                            name="email"
                            autoComplete="email"
                            data-cy="detailed-info-page-input-email"
                            placeholder="example@pupcle.com"
                            suffix
                            disabled={!editingDetailedInfo}
                          />
                        </Form.Item>
                      </Button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className="fixed inset-0 z-10 bg-black/30" />
                      <Dialog.Content
                        className={clsx(
                          "fixed z-20",
                          "w-[90vw] rounded-[50px] bg-white p-6 lg:w-[30%]",
                          "top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] dark:bg-gray-800 "
                        )}
                      >
                        <div className="w-full">
                          <div className="border-pupcleLightGray mb-7 flex h-[52px] w-full flex-row items-center justify-between border-b-[1px] px-7 pb-[10px]">
                            <span className="font-poppins text-pupcleOrange text-[14px]">
                              이메일 주소 변경 시, 해당 메일로 전송된
                              <br />
                              인증번호 6자리를 입력해주세요
                            </span>
                            <Dialog.Close asChild>
                              <Button className="h-[14px] w-[14px] border-none p-0 focus:outline-0 focus:ring-0">
                                <img
                                  className="h-[14px] w-[14px]"
                                  src="/close_icon.png"
                                />
                              </Button>
                            </Dialog.Close>
                          </div>
                          <span className="font-poppins mb-1 pl-6 text-[16px]">
                            이메일 주소
                          </span>
                          <Form.Item name="email">
                            <Input
                              className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-12 w-full rounded-full border-none px-6 text-[16px]"
                              name="email"
                              autoComplete="email"
                              data-cy="detailed-info-page-input-email"
                              placeholder="example@pupcle.com"
                              suffix
                              disabled={!editingDetailedInfo}
                            />
                          </Form.Item>
                        </div>
                        <div className="mb-4 flex flex-row justify-end">
                          <Input
                            className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-12 w-[60%] rounded-full border-none px-6 text-[16px]"
                            name="email verificationcode"
                            autoComplete="email verificationcode"
                            data-cy="detailed-info-page-input-email-verificationcode"
                            suffix
                            disabled={!editingDetailedInfo}
                          />
                          <div className="w-[40%] pl-5">
                            <Button className="bg-pupcleBlue h-[48px] w-full rounded-full border-none">
                              <span className="font-poppins text-[16px] font-semibold text-white">
                                코드 전송
                                {"TODO: if nothing in input and already sent the code, 코드 재전송,
                                if something in input then, 인증하기"}
                              </span>
                            </Button>
                          </div>
                        </div>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </div> */}
                <div className="flex w-full flex-col">
                  <span className="font-poppins mb-1 pl-6 text-[20px]">
                    휴대폰 번호
                  </span>
                  <Dialog.Root>
                    <Dialog.Trigger asChild>
                      <Button className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray mb-6 h-12 w-full rounded-full border-none px-6 text-[16px]">
                        <Form.Item name="phone" className="mb-0">
                          <Input
                            className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-full w-full rounded-full border-none p-0 text-[16px]"
                            name="phone"
                            autoComplete="phone"
                            data-cy="detailed-info-page-input-cellnumber"
                            placeholder="+82 10 0000 0000"
                            suffix
                            disabled={!editingDetailedInfo}
                          />
                        </Form.Item>
                      </Button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className="fixed inset-0 z-10 bg-black/30" />
                      <Dialog.Content
                        className={clsx(
                          "fixed z-20",
                          "w-[90vw] rounded-[50px] bg-white p-6 lg:w-[30%]",
                          "top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] dark:bg-gray-800 "
                        )}
                      >
                        <div className="w-full">
                          <div className="border-pupcleLightGray mb-7 flex h-[52px] w-full flex-row items-center justify-between border-b-[1px] px-7 pb-[10px]">
                            <span className="font-poppins text-pupcleOrange text-[14px]">
                              휴대폰 번호 변경을 위해
                              <br />
                              휴대폰 인증이 필요합니다.
                            </span>
                            <Dialog.Close asChild>
                              <Button className="h-[14px] w-[14px] border-none p-0 focus:outline-0 focus:ring-0">
                                <img
                                  className="h-[14px] w-[14px]"
                                  src="/close_icon.png"
                                />
                              </Button>
                            </Dialog.Close>
                          </div>
                          <span className="font-poppins mb-1 pl-6 text-[16px]">
                            휴대폰 번호
                          </span>
                          <Form.Item name="phone">
                            <Input
                              className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-12 w-full rounded-full border-none px-6 text-[16px]"
                              name="phone"
                              autoComplete="phone"
                              data-cy="detailed-info-page-input-phone"
                              placeholder="+82 10 0000 0000"
                              suffix
                              // disabled={!editingDetailedInfo}
                              // TODO: disabled after verification code has been sent
                            />
                          </Form.Item>
                        </div>
                        <div className="mb-4 flex flex-row justify-end">
                          <Input
                            className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-12 w-[60%] rounded-full border-none px-6 text-[16px]"
                            name="verificationcode"
                            autoComplete="verificationcode"
                            data-cy="detailed-info-page-input-verificationcode"
                            suffix
                            disabled={!editingDetailedInfo}
                          />
                          <div className="w-[40%] pl-5">
                            <Button className="bg-pupcleBlue h-[48px] w-full rounded-full border-none">
                              <span className="font-poppins text-[16px] font-semibold text-white">
                                코드 전송
                                {/* TODO: if nothing in input and already sent the code, 코드 재전송,
                                if something in input then, 인증하기 */}
                              </span>
                            </Button>
                          </div>
                        </div>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </div>
                <div className="flex w-full flex-col">
                  <span className="font-poppins mb-1 pl-6 text-[20px]">
                    주소
                  </span>
                  <Dialog.Root>
                    <Dialog.Trigger asChild>
                      <Button className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray mb-6 h-12 w-full rounded-full border-none px-6 text-[16px]">
                        <Form.Item name="address.address1" className="mb-0">
                          <Input
                            className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-full w-full rounded-full border-none p-0 text-[16px]"
                            name="address.address1"
                            autoComplete="address1"
                            data-cy="detailed-info-page-input-address1"
                            placeholder="주소 검색"
                            suffix=""
                            disabled={!editingDetailedInfo}
                          />
                        </Form.Item>
                      </Button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className="fixed inset-0 z-10 bg-black/30" />
                      <Dialog.Content
                        className={clsx(
                          "fixed z-20",
                          "w-[90vw] rounded-[50px] bg-white p-6 lg:w-[50%]",
                          "top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] dark:bg-gray-800 "
                        )}
                      >
                        <div className="w-full">
                          <div className="border-pupcleLightGray mb-7 flex h-[52px] w-full flex-row items-center justify-end border-b-[1px] px-7 pb-[10px]">
                            <Dialog.Close asChild>
                              <Button className="h-[14px] w-[14px] border-none p-0 focus:outline-0 focus:ring-0">
                                <img
                                  className="h-[14px] w-[14px]"
                                  src="/close_icon.png"
                                />
                              </Button>
                            </Dialog.Close>
                          </div>
                          {/* TODO: 주소 검색 api 가져오기 */}
                          <Form.Item name="address.address1">
                            <Input
                              className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-12 w-full rounded-full border-none px-6 text-[16px]"
                              name="address.address1"
                              autoComplete="address1"
                              data-cy="detailed-info-page-input-address1"
                              placeholder="주소를 입력하세요"
                              suffix
                              // disabled={!editingDetailedInfo}
                            />
                          </Form.Item>
                        </div>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </div>
                <div className="flex w-full flex-col">
                  <span className="font-poppins mb-1 pl-6 text-[20px]">
                    상세 주소
                  </span>
                  <Form.Item name="address.address2">
                    <Input
                      className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-12 w-full rounded-full border-none px-6 text-[16px]"
                      name="address.address2"
                      autoComplete="address2"
                      data-cy="detailed-info-page-input-address2"
                      suffix=""
                      disabled={!editingDetailedInfo}
                    />
                  </Form.Item>
                </div>
                <div className="flex w-full flex-col">
                  <span className="font-poppins mb-1 pl-6 text-[20px]">
                    우편번호
                  </span>
                  {/* TODO: 주소에서 우편번호 자동으로 가져오기 */}
                  <Form.Item name="address.postalCode">
                    <Input
                      className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-12 w-full rounded-full border-none px-6 text-[16px]"
                      name="address.postalCode"
                      autoComplete="postal-code postalCode"
                      data-cy="detailed-info-page-input-postalcode"
                      suffix=""
                      disabled={!editingDetailedInfo}
                    />
                  </Form.Item>
                </div>
                {/* <div className="flex w-full flex-col">
                  <span className="font-poppins mb-1 pl-6 text-[20px]">
                    비밀번호
                  </span>
                  <Dialog.Root>
                    <Dialog.Trigger asChild>
                      <Button className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray mb-6 h-12 w-full rounded-full border-none px-6 text-[16px]">
                        <Form.Item name="password" className="mb-0">
                          <Input
                            className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-full w-full rounded-full border-none p-0 text-[16px]"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            data-cy="detailed-info-page-input-password"
                            suffix=""
                            disabled={!editingDetailedInfo}
                          />
                        </Form.Item>
                      </Button>
                    </Dialog.Trigger>
                    <Dialog.Portal>
                      <Dialog.Overlay className="fixed inset-0 z-10 bg-black/30" />
                      <Dialog.Content
                        className={clsx(
                          "fixed z-20",
                          "w-[90vw] rounded-[50px] bg-white p-6 lg:w-[30%]",
                          "top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] dark:bg-gray-800 "
                        )}
                      >
                        <div className="w-full">
                          <div className="border-pupcleLightGray mb-7 flex h-[52px] w-full flex-row items-center justify-between border-b-[1px] px-7 pb-[10px]">
                            <span className="font-poppins text-pupcleOrange text-[14px]">
                              비밀번호를 변경을 위해
                              <br />
                              현재 비밀번호 인증이 필요합니다.
                            </span>
                            <Dialog.Close asChild>
                              <Button className="h-[14px] w-[14px] border-none p-0 focus:outline-0 focus:ring-0">
                                <img
                                  className="h-[14px] w-[14px]"
                                  src="/close_icon.png"
                                />
                              </Button>
                            </Dialog.Close>
                          </div>
                          <span className="font-poppins mb-1 pl-6 text-[16px]">
                            비밀번호
                          </span>
                          <Form.Item name="password">
                            <Input.Password
                              className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-12 w-full rounded-full border-none px-6 text-[16px]"
                              name="password"
                              autoComplete="new-password"
                              data-cy="detailed-info-page-input-password"
                              iconRender={(visible) =>
                                visible ? (
                                  <img
                                    src="/password_visible.png"
                                    style={{ width: "22px" }}
                                    alt="password visible"
                                  />
                                ) : (
                                  <img
                                    src="/password_invisible.png"
                                    style={{ width: "22px" }}
                                    alt="password invisible"
                                  />
                                )
                              }
                              suffix
                            />
                          </Form.Item>
                        </div>
                        <div className="mb-4 flex flex-row justify-end">
                          <div className="w-[40%] pl-5">
                            <Button className="bg-pupcleBlue h-[48px] w-full rounded-full border-none">
                              <span className="font-poppins text-[16px] font-semibold text-white">
                                인증하기
                                {"TODO: if nothing in input and already sent the code, 코드 재전송,
                                if something in input then, 인증하기"}
                              </span>
                            </Button>
                          </div>
                        </div>
                      </Dialog.Content>
                    </Dialog.Portal>
                  </Dialog.Root>
                </div>
                <div className="flex w-full flex-col">
                  <span className="font-poppins mb-1 pl-6 text-[20px]">
                    비밀번호 확인
                  </span>
                  <Form.Item name="confirmpassword">
                    <Input
                      className="bg-pupcleLightLightGray font-poppins placeholder:text-pupcleGray h-12 w-full rounded-full border-none px-6 text-[16px]"
                      name="confirmpassword"
                      autoComplete="confirmpassword"
                      data-cy="detailed-info-page-input-confirmpassword"
                      suffix=""
                      disabled={!editingDetailedInfo}
                    />
                  </Form.Item>
                </div> */}
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
                {editingDetailedInfo ? (
                  <Form.Item name="_submit" className="m-0 w-full">
                    <SubmitButton
                      className={clsx(
                        "account-submit-button bg-pupcleBlue h-[48px] w-full rounded-full border-none"
                      )}
                      onClick={() => setEditingDetailedInfo(true)}
                    >
                      <span className="font-poppins text-[20px] font-semibold text-white">
                        저장하기
                      </span>
                    </SubmitButton>
                  </Form.Item>
                ) : (
                  <Button
                    className={clsx(
                      "account-edit-button border-pupcleBlue h-[48px] w-full rounded-full border-2 bg-transparent",
                      {
                        invisible: editingDetailedInfo,
                      }
                    )}
                    onClick={() => setEditingDetailedInfo(true)}
                  >
                    <span className="text-pupcleBlue font-poppins text-[20px] font-semibold">
                      프로필 수정
                    </span>
                  </Button>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </>
  );
};

export default Account;
