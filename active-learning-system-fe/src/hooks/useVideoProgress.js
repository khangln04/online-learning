import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

/**
 * Custom hook để tracking video progress và tự động lưu WatchedDuration
 * @param {Object} lessonProgress - Object chứa thông tin lesson progress
 * @param {number} lessonProgress.id - ID của lesson progress
 * @param {number} lessonProgress.videoId - ID của video
 * @param {number} lessonProgress.watchedDuration - Thời gian đã xem (giây)
 * @param {boolean} lessonProgress.status - Trạng thái hoàn thành
 * @param {Function} onStatusUpdate - Callback khi status được update (true khi đạt 90%)
 */
export const useVideoProgress = (lessonProgress, onStatusUpdate) => {
  const videoRef = useRef(null);
  const progressInterval = useRef(null);
  const lastSavedTime = useRef(0);
  const hasReached90Percent = useRef(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  // Gửi request cập nhật progress
  const updateWatchProgress = useCallback(
    async (watchedSeconds) => {
      const lessonProgressId = Number(lessonProgress?.id);
      const watchedSecInt = Math.floor(watchedSeconds);

      if (!lessonProgressId || lessonProgressId <= 0 || isNaN(lessonProgressId)) return;
      if (watchedSecInt <= 0) return; // Chỉ update khi thời gian xem lớn hơn 0

      try {
        await axios.post(
          'https://localhost:5000/api/CourseProgress/update-watch-status',
          {
            LessonProgressId: lessonProgressId,
            WatchedSeconds: watchedSecInt,
          },
          { headers: getAuthHeaders() }
        );

        console.log('Progress updated:', watchedSecInt, 'seconds');
      } catch (error) {
        console.error('Error updating video progress:', error);
      }
    },
    [lessonProgress?.id]
  );

  const startProgressTracking = useCallback(() => {
    if (progressInterval.current) return;

    progressInterval.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;

        if (isNaN(currentTime) || isNaN(duration) || duration === 0) return;

        // Gửi cập nhật khi thay đổi ít nhất 2 giây
        if (Math.abs(currentTime - lastSavedTime.current) >= 2) {
          lastSavedTime.current = currentTime;
          updateWatchProgress(currentTime);
        }

        // Check nếu chưa đạt 90% thì trigger callback
        if (!hasReached90Percent.current && (currentTime / duration) >= 0.9) {
          hasReached90Percent.current = true;
          console.log('🎯 Video reached 90% completion!');
          if (onStatusUpdate) onStatusUpdate(true);
        }
      }
    }, 5000);
  }, [updateWatchProgress, onStatusUpdate]);

  const stopProgressTracking = useCallback(() => {
    if (progressInterval.current) {
clearInterval(progressInterval.current);
      progressInterval.current = null;
      console.log('Stopped tracking progress interval');
    }
  }, []);

  const saveCurrentProgress = useCallback(() => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      if (currentTime > 0) {
        updateWatchProgress(currentTime);
      }
    }
  }, [updateWatchProgress]);

  const handlePlay = useCallback(() => {
    console.log('Video started playing');
    startProgressTracking();
  }, [startProgressTracking]);

  const handlePause = useCallback(() => {
    console.log('Video paused - saving progress');
    stopProgressTracking();
    saveCurrentProgress();
  }, [stopProgressTracking, saveCurrentProgress]);

  const handleEnded = useCallback(() => {
    console.log('Video ended - saving final progress');
    stopProgressTracking();
    saveCurrentProgress();
  }, [stopProgressTracking, saveCurrentProgress]);

  // Reset các ref tracking khi lessonProgress thay đổi
  useEffect(() => {
    lastSavedTime.current = 0;
    hasReached90Percent.current = false;
  }, [lessonProgress?.id, lessonProgress?.watchedDuration]);

  // Gọi initializeVideoProgress khi videoRef và watchedDuration đã sẵn sàng
  useEffect(() => {
    if (videoRef.current && lessonProgress?.watchedDuration > 0) {
      videoRef.current.currentTime = lessonProgress.watchedDuration;
      console.log(`Resumed video from: ${lessonProgress.watchedDuration} seconds`);
    }
  }, [lessonProgress?.watchedDuration]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (videoRef.current && videoRef.current.currentTime > 0) {
        try {
          const token = localStorage.getItem('token');
          const xhr = new XMLHttpRequest();
          xhr.open('POST', 'https://localhost:5000/api/CourseProgress/update-watch-status', false);
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(
            JSON.stringify({
              LessonProgressId: Number(lessonProgress?.id),
              WatchedSeconds: Math.floor(videoRef.current.currentTime),
            })
          );
        } catch (error) {
          console.error('Failed to save progress on page unload:', error);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && videoRef.current && !videoRef.current.paused) {
        saveCurrentProgress();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopProgressTracking();
      saveCurrentProgress();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lessonProgress?.id, stopProgressTracking, saveCurrentProgress]);

  return {
    videoRef,
handlePlay,
    handlePause,
    handleEnded,
    saveCurrentProgress,
  };
};