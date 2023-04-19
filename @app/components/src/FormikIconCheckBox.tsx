import { CheckCircleOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { ButtonProps as $ButtonProps } from "antd/lib/button/button";
import { FieldProps } from "formik";
import { Field } from "formik-antd";
import * as React from "react";

export interface FormikFieldProps {
  name: string;
  validate?: (value: any) => undefined | string | Promise<any>;
  fast?: boolean;
}

export type ButtonProps = FormikFieldProps & $ButtonProps;

export const FormikIconCheckBox = ({
  name,
  validate,
  fast,
  onChange,
  ...restProps
}: ButtonProps) => (
  // @ts-ignore
  <Field name={name} validate={validate} fast={fast}>
    {({
      field: { value },
      form: { setFieldValue, setFieldTouched },
    }: FieldProps) => (
      <Button
        name={name}
        onClick={(event) => {
          setFieldValue(name, !value);
          setFieldTouched(name, true, false);
          if (onChange) {
            onChange(event);
          }
        }}
        {...restProps}
      >
        <CheckCircleOutlined
          name={name}
          style={{
            marginRight: "4px",
            fontSize: "14px",
            color: value ? "#7FB3E8" : "#8F9092",
            fontFamily: "Poppins, sans-serif",
          }}
        />
      </Button>
      // <$Checkbox
      //   name={name}
      //   checked={value}
      //   onChange={(event) => {
      //     setFieldValue(name, event.target.checked);
      //     setFieldTouched(name, true, false);
      //     onChange && onChange(event);
      //   }}
      //   {...restProps}
      // />
    )}
  </Field>
);
