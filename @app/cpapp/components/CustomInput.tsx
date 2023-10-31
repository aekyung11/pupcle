import { styled } from "nativewind";
import React from "react";
import { TextInput } from "react-native";

const StyledTextInput = styled(TextInput);

const CustomInput = (props: any) => {
  const {
    field: { name, onBlur, onChange, value },
    form: { errors, touched, setFieldTouched },
    inputClassName,
    ...inputProps
  } = props;

  const hasError = errors[name] && touched[name];

  return (
    <>
      <StyledTextInput
        autoCorrect={false}
        error={hasError && errors[name]}
        value={value}
        onChangeText={(text) => onChange(name)(text)}
        onBlur={() => {
          setFieldTouched(name);
          onBlur(name);
        }}
        hideUnderline={true}
        className={inputClassName}
        {...inputProps}
      />
      {/* {hasError && <Text tyle={styles.errorText}>{errors[name]}</Text>} */}
    </>
  );
};

export default CustomInput;
