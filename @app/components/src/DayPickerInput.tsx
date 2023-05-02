import { format, isValid, parse } from "date-fns";
import FocusTrap from "focus-trap-react";
import React, { ChangeEventHandler, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { usePopper } from "react-popper";

export type DayPickerInputProps = {
  selected: Date;
  setSelected: (date: Date | undefined) => void;
};

export function DayPickerInput({ selected, setSelected }: DayPickerInputProps) {
  const [inputValue, setInputValue] = useState<string>("");
  const [isPopperOpen, setIsPopperOpen] = useState(false);

  const popperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null
  );

  const popper = usePopper(popperRef.current, popperElement, {
    placement: "bottom-start",
  });

  const closePopper = () => {
    setIsPopperOpen(false);
    buttonRef?.current?.focus();
  };

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setInputValue(e.currentTarget.value);
    const date = parse(e.currentTarget.value, "y-MM-dd", new Date());
    if (isValid(date)) {
      setSelected(date);
    } else {
      setSelected(undefined);
    }
  };

  const handleButtonClick = () => {
    setIsPopperOpen(true);
  };

  const handleDaySelect = (date: Date) => {
    setSelected(date);
    if (date) {
      setInputValue(format(date, "y-MM-dd"));
      closePopper();
    } else {
      setInputValue("");
    }
  };

  return (
    <div>
      <div ref={popperRef}>
        <input
          type="text"
          placeholder={format(new Date(), "y-MM-dd")}
          value={inputValue}
          onChange={handleInputChange}
          className="input-reset pa2 ma2 black ba bg-white"
        />
        <button
          ref={buttonRef}
          type="button"
          className="pa2 button-reset ba bg-white"
          aria-label="Pick a date"
          onClick={handleButtonClick}
        >
          <span role="img" aria-label="calendar icon">
            📅
          </span>
        </button>
      </div>
      {isPopperOpen && (
        <FocusTrap
          active
          focusTrapOptions={{
            initialFocus: false,
            allowOutsideClick: true,
            clickOutsideDeactivates: true,
            onDeactivate: closePopper,
            // @ts-ignore
            fallbackFocus: buttonRef.current,
          }}
        >
          <div
            tabIndex={-1}
            style={popper.styles.popper}
            className="dialog-sheet"
            {...popper.attributes.popper}
            ref={setPopperElement}
            role="dialog"
            aria-label="DayPicker calendar"
          >
            <DayPicker
              initialFocus={isPopperOpen}
              mode="single"
              defaultMonth={selected}
              selected={selected}
              // @ts-ignore
              onSelect={handleDaySelect}
            />
          </div>
        </FocusTrap>
      )}
    </div>
  );
}
