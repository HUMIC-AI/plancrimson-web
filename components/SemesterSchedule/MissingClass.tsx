/* eslint-disable jsx-a11y/label-has-associated-control */
import { Disclosure } from '@headlessui/react';
import React, { Fragment } from 'react';
import { useForm, FieldValues } from 'react-hook-form';
import type { ClassSchedulingInfo, ExtendedClass } from '@/src/lib';
import {
  getClassId, DAYS_OF_WEEK,
  strToDec,
  decToStr,
} from '@/src/lib';
import { useAppDispatch, useAppSelector } from '@/src/utils/hooks';
import { Settings } from '@/src/features';

export function MissingClass({ cls }: { cls: ClassSchedulingInfo; }) {
  const dispatch = useAppDispatch();
  const classTime = useAppSelector(Settings.selectCustomTime(cls.id));

  const { register, handleSubmit } = useForm();

  const onSubmit = (data: FieldValues) => {
    const start = strToDec(data.startTime);
    const end = strToDec(data.endTime);
    if ([start, end].some(Number.isNaN) || start >= end) {
      alert('Invalid time. Please try again.');
    } else {
      dispatch(Settings.customTime({
        classId: cls.id,
        pattern: DAYS_OF_WEEK.filter((day) => data[day]),
        start,
        end,
        startDate: data.startDate,
        endDate: data.endDate,
      }));
    }
  };

  return (
    <>
      <h4>{`${cls.SUBJECT + cls.CATALOG_NBR} | ${cls.Title}`}</h4>
      <Disclosure as="div">
        <Disclosure.Button className="font-bold underline transition-opacity hover:opacity-50">
          Add time
        </Disclosure.Button>
        <Disclosure.Panel>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <div className="grid grid-cols-[auto_1fr] items-center rounded-lg border-2 p-2 shadow">
                {DAYS_OF_WEEK.slice(0, 5).map((day) => (
                  <Fragment key={cls.id + day}>
                    <label htmlFor={cls.id + day} className="text-right">
                      {day}
                    </label>
                    <input
                      type="checkbox"
                      id={cls.id + day}
                      className="ml-2 px-2 py-1"
                      defaultChecked={classTime?.pattern.includes(day)}
                      {...register(day)}
                    />
                  </Fragment>
                ))}
              </div>
              <div className="mt-4 grid h-min w-max grid-cols-[1fr_auto] items-center sm:mt-0">
                <label htmlFor="startTime" className="mr-2 text-right">
                  Start time:
                </label>
                <input
                  type="time"
                  id="startTime"
                  {...register('startTime')}
                  className="primary"
                  defaultValue={classTime && decToStr(classTime.start)}
                />

                <label htmlFor="endTime" className="mr-2 text-right">
                  End time:
                </label>
                <input
                  type="time"
                  id="endTime"
                  {...register('endTime')}
                  className="primary"
                  defaultValue={classTime && decToStr(classTime.end)}
                />

                <label htmlFor="startDate" className="mr-2 text-right">
                  Start date:
                </label>
                <input
                  type="date"
                  id="startDate"
                  {...register('startDate')}
                  className="primary"
                  defaultValue={classTime?.startDate}
                />

                <label htmlFor="endDate" className="mr-2 text-right">
                  End date:
                </label>
                <input
                  type="date"
                  id="endDate"
                  {...register('endDate')}
                  className="primary"
                  defaultValue={classTime?.endDate}
                />
              </div>
            </div>
            <button
              type="submit"
              className="interactive mt-4 rounded-md bg-gray-secondary px-4 py-2"
            >
              Save
            </button>
          </form>
        </Disclosure.Panel>
      </Disclosure>
    </>
  );
}
