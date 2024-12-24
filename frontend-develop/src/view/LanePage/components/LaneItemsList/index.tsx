import '@view/LanePage/components/LaneItemsList/index.css';
import { LaneItem } from '@view/LanePage/components';
import { ObjectToCamel } from 'ts-case-convert/lib/caseConvert';
import { ClientWithVideo } from 'frontend-sdk/dist/client/types';
import React, { forwardRef } from 'react';

interface LaneItemsListProps {
  lanes: Array<
    ObjectToCamel<ClientWithVideo> & {
    isSelected: boolean;
  }
  >;
  onLaneClick: (laneIndex: number) => void;
  isTV: boolean;
  autoPlay: boolean;
}

export const LaneItemsList = forwardRef<HTMLDivElement, LaneItemsListProps>(
  ({ lanes, onLaneClick, isTV, autoPlay }, ref) => {
    return (
      <div className={isTV ? "background-scroller" : ""}>
        <div ref={ref} className={`lane-items ${isTV ? "lane-items-scrolling" : ""}`}>
          {lanes.map((lane, index) => (
            <div key={`lane-${index}`}>
              <LaneItem client={lane} onLaneClick={onLaneClick} index={index} isTV={isTV} autoPlay={autoPlay}  />
            </div>
          ))}
          {isTV &&
            lanes.map((lane, index) => (
              <div key={`lane-duplicate-${index}`}>
                <LaneItem client={lane} onLaneClick={onLaneClick} index={index} isTV={isTV} autoPlay={autoPlay}/>
              </div>
            ))}
        </div>
      </div>
    );
  }
);
