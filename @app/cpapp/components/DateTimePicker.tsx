import { Calendar, Clock } from "@tamagui/lucide-icons";
import React, { useEffect, useState } from "react";
import { Pressable } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker"; // https://github.com/mmazzarolo/react-native-modal-datetime-picker
import { Input, XStack } from "tamagui";

interface datePickerProps {
  date?: Date;
  type: "date" | "time";
  confirmText?: string;
  cancelText?: string;
  accentColor?: string;
  textColor?: string;
  buttonTextColorIOS?: string;
  onChange?: (date: Date) => void;
  onConfirm?: (date: Date) => void;
}

const DateTimePicker = function DatePicker(props: datePickerProps) {
  const [show, setShow] = useState(false);
  const [date, setDate] = useState(props.date);

  useEffect(() => {
    setDate(props.date);
  }, [props.date]);

  const hideDatePicker = () => {
    setShow(false);
  };

  const handleConfirm = (date: Date) => {
    setDate(date);
    if (props.onConfirm) {
      props.onConfirm(date);
    }
    hideDatePicker();
  };

  const type = props.type || "date";

  return (
    <Pressable onPress={() => setShow(true)}>
      <XStack alignItems={"center"} justifyContent="flex-end">
        <Input pointerEvents="none" editable={false} flexGrow={1}>
          {type === "date" && date?.toLocaleDateString()}

          {type === "time" && date?.toLocaleTimeString()}
        </Input>

        <XStack paddingRight={10} position="absolute">
          {type === "date" && <Calendar />}

          {type === "time" && <Clock />}
        </XStack>
      </XStack>

      <DateTimePickerModal
        cancelTextIOS={props.cancelText}
        confirmTextIOS={props.confirmText}
        date={date}
        isVisible={show}
        mode={type}
        // display="inline"
        accentColor={props.accentColor}
        textColor={props.textColor}
        buttonTextColorIOS={props.buttonTextColorIOS}
        onChange={props.onChange}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />
    </Pressable>
  );
};

export default DateTimePicker;
