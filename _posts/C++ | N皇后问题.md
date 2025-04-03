# N皇后问题
> N皇后问题是指在N*N的棋盘上要摆N个皇后，要求任何两个皇后不同行、不同列，也不在同一条斜线上。给定一个整数n，返回n皇后的摆法有多少种。
```c++
int num(int n)
{
    if(n < 1) return 0;
    // record[i]=j 表示i行的皇后放在了第j列(这样可以省去了用二维数组来表示)
    vector<int> record(n);
    return process(0, record, n);
}

// 目前来到了第i行(总共有n行)
// record[0...i-1]表示之前的行放了皇后(潜台词：前i-1行任何两个皇后都不共行、列、斜线)
// 返回值代表百万所有的皇后，合法的摆法共有多少种
int process(int i, vector<int> record, int n)
{
    if(i == n) return 1;  // 来到终止行
    int res = 0;
    for(int j = 0; j < n; j++) // 当前行在i行，但要尝试i行所有的列 -> j
    {
        // 当前i行的皇后，放在j列，会不会和之前(0...i-1)的皇后共行共列共斜线
        // 如果是，认为无效；如果不是，认为有效
        if(isValid(record, i, j))
        {
            record[i] = j;
            res += process(i + 1, record, n);
        }
    }
    return res;
}


bool isValid(vector<int> record, int i, int j)
{
    for(int k = 0; k < i; k++)
    {
        if( j == record[k] || abs(record[k]-j) == i-k) return false;
        //    ^ 共列 ^                 ^ 共斜线 ^
    }
    return true;
}

```
