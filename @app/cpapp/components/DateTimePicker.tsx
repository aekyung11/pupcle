import { Calendar, Clock } from "@tamagui/lucide-icons";
import { View } from "moti";
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
    <View className="border-pupcleBlue flex h-12 w-[220px] flex-row items-center justify-between rounded-full border-[1px]">
      <Pressable onPress={() => setShow(true)}>
        <View className="flex w-[220px] flex-row justify-between px-5">
          <Input
            unstyled
            className="text-[#8F9092]"
            pointerEvents="none"
            editable={false}
          >
            {type === "date" && date?.toLocaleDateString()}

            {type === "time" && date?.toLocaleTimeString()}
          </Input>

          <View>
            {type === "date" && <Calendar color="#8F9092" size={16} />}

            {type === "time" && <Clock />}
          </View>
        </View>

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
    </View>
  );
};

export default DateTimePicker;
