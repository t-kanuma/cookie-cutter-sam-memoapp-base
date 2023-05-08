export type Memo = {
  userId: string;
  id: string;
  archived: boolean;
  done: boolean;
  favorite: boolean;
  title: string;
  text: string;
};

export type InitMemo = {
  [key in "title" | "text"]: Memo[key];
};
