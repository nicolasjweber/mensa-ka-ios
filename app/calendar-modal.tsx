import {
  Button,
  DatePicker,
  Form,
  Host,
  LabeledContent,
  Section,
  Text as SwiftText,
} from '@expo/ui/swift-ui';
import { datePickerStyle } from '@expo/ui/swift-ui/modifiers';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';

import {
  formatDateHeader,
  parseDateInput,
  toDateString,
} from '@/lib/utils/date';
import { useMensa } from '@/store/MensaContext';

export default function CalendarModalScreen() {
  const router = useRouter();
  const {
    date,
    todayWeekday,
    setDate,
    shiftDate,
    goToToday,
    effectiveLanguage,
    effectiveScheme,
    palette,
    t,
  } = useMensa();

  const [selectedDate, setSelectedDate] = useState<Date>(() => parseDateInput(date));
  const selectedDateStr = toDateString(selectedDate);

  const handleConfirm = () => {
    setDate(selectedDateStr);
    router.back();
  };

  const handleNextWeek = () => {
    shiftDate(5);
    router.back();
  };

  const handleToday = () => {
    goToToday();
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: t.calendar.title }} />

      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button
          icon="xmark"
          accessibilityLabel={t.calendar.cancel}
          onPress={() => router.back()}
        />
      </Stack.Toolbar>

      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="checkmark"
          accessibilityLabel={t.calendar.applyAccessibility}
          onPress={handleConfirm}
        />
      </Stack.Toolbar>

      <Host
        style={{ flex: 1, backgroundColor: palette.canvas }}
        colorScheme={effectiveScheme}
        seedColor={palette.brand}
      >
        <Form>
          <Section>
            <DatePicker
              title={t.calendar.pickerTitle}
              displayedComponents={['date']}
              selection={selectedDate}
              onDateChange={setSelectedDate}
              modifiers={[datePickerStyle('graphical')]}
            />
          </Section>

          <Section>
            <LabeledContent label={t.calendar.selectedDay}>
              <SwiftText>{formatDateHeader(selectedDateStr, effectiveLanguage)}</SwiftText>
            </LabeledContent>

            <Button
              label={t.calendar.applyButton}
              systemImage="checkmark.circle.fill"
              onPress={handleConfirm}
            />

            <Button
              label={t.calendar.nextWeekButton}
              systemImage="calendar.badge.plus"
              onPress={handleNextWeek}
            />

            {date !== todayWeekday || selectedDateStr !== todayWeekday ? (
              <Button
                label={t.calendar.todayButton}
                systemImage="arrow.counterclockwise"
                onPress={handleToday}
              />
            ) : null}
          </Section>
        </Form>
      </Host>
    </>
  );
}
