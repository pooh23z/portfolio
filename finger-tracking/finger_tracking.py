import cv2
import mediapipe as mp
import numpy as np
import math

# 1. ตั้งค่า MediaPipe
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2, # เปลี่ยนเป็นรองรับ 2 มือแล้ว!
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)
mp_draw = mp.solutions.drawing_utils

# 2. เปิดกล้อง
cap = cv2.VideoCapture(1)

# แยกตัวแปรพิกัดและสี สำหรับ "มือซ้าย" และ "มือขวา" ออกจากกัน
px = {"Left": 0, "Right": 0}
py = {"Left": 0, "Right": 0}
canvas = None

# สีต่างๆ
color_red = (0, 0, 255)
color_green = (0, 255, 0)
color_blue = (255, 0, 0)
color_yellow = (0, 255, 255)
color_eraser = (0, 0, 0)

# ให้มือซ้ายเริ่มด้วยสีแดง มือขวาเริ่มด้วยสีเขียว จะได้วาดสนุกๆ
current_color = {"Left": color_red, "Right": color_green}
brush_thickness = 10
eraser_thickness = 50

while True:
    success, img = cap.read()
    if not success:
        break

    img = cv2.flip(img, 1)
    h, w, c = img.shape
    
    if canvas is None:
        canvas = np.zeros_like(img)

    # วาดเมนูสีด้านบน
    menu_w = w // 5
    cv2.rectangle(img, (0, 0), (menu_w, 80), color_red, cv2.FILLED)
    cv2.rectangle(img, (menu_w, 0), (menu_w*2, 80), color_green, cv2.FILLED)
    cv2.rectangle(img, (menu_w*2, 0), (menu_w*3, 80), color_blue, cv2.FILLED)
    cv2.rectangle(img, (menu_w*3, 0), (menu_w*4, 80), color_yellow, cv2.FILLED)
    cv2.rectangle(img, (menu_w*4, 0), (w, 80), (50, 50, 50), cv2.FILLED)
    cv2.putText(img, "ERASER", (menu_w*4 + 10, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = hands.process(img_rgb)

    if results.multi_hand_landmarks:
        # วนลูปเช็คมือแต่ละข้างที่เจอ
        for hand_idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
            mp_draw.draw_landmarks(img, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            
            # ตรวจสอบว่าเป็นมือซ้ายหรือมือขวา (เพื่อแยกเส้นไม่ให้พันกัน)
            hand_label = results.multi_handedness[hand_idx].classification[0].label
            
            lm_list = []
            for id, lm in enumerate(hand_landmarks.landmark):
                cx, cy = int(lm.x * w), int(lm.y * h)
                lm_list.append((cx, cy))
                
            if len(lm_list) != 0:
                x1, y1 = lm_list[8]  # ปลายนิ้วชี้
                x2, y2 = lm_list[12] # ปลายนิ้วกลาง
                x0, y0 = lm_list[4]  # ปลายนิ้วโป้ง
                
                # เช็คว่านิ้วชี้และนิ้วกลางชูขึ้นไหม
                fingers_up = []
                fingers_up.append(lm_list[8][1] < lm_list[6][1]) # นิ้วชี้
                fingers_up.append(lm_list[12][1] < lm_list[10][1]) # นิ้วกลาง
                
                # คำนวณระยะห่างระหว่าง "นิ้วชี้" กับ "นิ้วโป้ง" (ท่าจีบ)
                pinch_dist = math.hypot(x1 - x0, y1 - y0)
                
                # === 1. โหมดเลือกสี (ชู 2 นิ้ว: ชี้+กลาง) ===
                if fingers_up[0] and fingers_up[1]:
                    px[hand_label], py[hand_label] = 0, 0
                    cv2.rectangle(img, (x1, y1 - 25), (x2, y2 + 25), current_color[hand_label], cv2.FILLED)
                    
                    if y1 < 80:
                        if 0 < x1 < menu_w:
                            current_color[hand_label] = color_red
                        elif menu_w < x1 < menu_w*2:
                            current_color[hand_label] = color_green
                        elif menu_w*2 < x1 < menu_w*3:
                            current_color[hand_label] = color_blue
                        elif menu_w*3 < x1 < menu_w*4:
                            current_color[hand_label] = color_yellow
                        elif menu_w*4 < x1 < w:
                            current_color[hand_label] = color_eraser
                            
                # === 2. โหมดวาด/หยุดวาด (ชูแค่นิ้วชี้ นิ้วกลางพับลง) ===
                elif fingers_up[0] and not fingers_up[1]:
                    # ถ้าระยะห่างนิ้วชี้กับนิ้วโป้งน้อยกว่า 40 แปลว่า "จีบนิ้ว" = หยุดวาด (Hover)
                    if pinch_dist < 40:
                        cv2.circle(img, (x1, y1), 15, (255, 0, 0), cv2.FILLED) # สีน้ำเงิน (Hover)
                        px[hand_label], py[hand_label] = 0, 0
                    # ถ้ากางนิ้วโป้งออก = วาดรูป (Draw)
                    else:
                        cv2.circle(img, (x1, y1), 15, current_color[hand_label], cv2.FILLED)
                        if px[hand_label] == 0 and py[hand_label] == 0:
                            px[hand_label], py[hand_label] = x1, y1
                            
                        thickness = eraser_thickness if current_color[hand_label] == color_eraser else brush_thickness
                        cv2.line(canvas, (px[hand_label], py[hand_label]), (x1, y1), current_color[hand_label], thickness)
                        px[hand_label], py[hand_label] = x1, y1

    # รวมภาพ
    imgGray = cv2.cvtColor(canvas, cv2.COLOR_BGR2GRAY)
    _, imgInv = cv2.threshold(imgGray, 50, 255, cv2.THRESH_BINARY_INV)
    imgInv = cv2.cvtColor(imgInv, cv2.COLOR_GRAY2BGR)
    img = cv2.bitwise_and(img, imgInv)
    img = cv2.bitwise_or(img, canvas)
    
    cv2.imshow("Hand Tracking (Multi-Hand Air Canvas)", img)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('c'):
        canvas = np.zeros_like(img)

cap.release()
cv2.destroyAllWindows()
