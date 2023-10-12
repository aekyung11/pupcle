import React from "react";
import { TextInput } from "react-native";

const CustomInput = (props: any) => {
  const {
    field: { name, onBlur, onChange, value },
    form: { errors, touched, setFieldTouched },
    ...inputProps
  } = props;

  const hasError = errors[name] && touched[name];

  return (
    <>
      <TextInput
        autoCorrect={false}
        error={hasError && errors[name]}
        value={value}
        onChangeText={(text) => onChange(name)(text)}
        onBlur={() => {
          setFieldTouched(name);
          onBlur(name);
        }}
        hideUnderline={true}
        {...inputProps}
      />
      {/* {hasError && <Text tyle={styles.errorText}>{errors[name]}</Text>} */}
    </>
  );
};

export default CustomInput;
