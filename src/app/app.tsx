"use client"
import "@/app/styles.css"
import { Dispatch, MouseEventHandler, SetStateAction, useEffect, useState } from "react";
import Image from "next/image";
import init, {generate_grid} from "../../pkg/minesweeper.js"

type Option<T> = T | null

type TileState = "Flagged" | "Hidden" | { Value: Option<number> }
type TileAnswer = "Mine" | { Value: Option<number> }
type GameRule = "Normal" | "Torus" | "Lier"
type BoardAnswer = TileAnswer[][]
type Board = TileState[][]

type TileProps = {
    value: TileState,
    onClick: () => void,
    onLeftClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}

type BoardWithAnswer = {
    answer: BoardAnswer,
    tiles: Board
}


type BoardProps = {
    board: Board,
    answer: BoardAnswer,
    onClick: (x: number, y: number) => void,
    onLeftClick: (x: number, y: number) => ((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void),
}
type StageData = BoardWithAnswer | { rule: GameRule, width: number, height: number, mines: number, reveal: number }


type StageProps = {
    data: StageData[],
    setClearCount: Dispatch<SetStateAction<number>>
}


export default function App() {
    const [stageId, setStageId] = useState(0);
    const [clearCount, setClearCount] = useState(0);
    const first: BoardWithAnswer = {
        answer: [["Mine", "Mine", "Mine"], ["Mine", { Value: 8 }, "Mine"], ["Mine", "Mine", "Mine"]],
        tiles: [["Hidden", "Hidden", "Hidden"], ["Hidden", { Value: 8 }, "Hidden"], ["Hidden", "Hidden", "Hidden"]]
    };
    const defaultSetting: StageData = { rule: "Lier", width: 3, height: 3, mines: 5, reveal: 2 }

    useEffect(() => {
        init()
    }, [])
    const stages = [[first, defaultSetting, defaultSetting]]

    function NextStageButton() {
        function onClick() {
            if (stageId + 1 < stages.length) {
                setStageId(id => id + 1)
            }
        }
        return <button onClick={onClick}>next stage</button>
    }
    return <div><Stage data={stages[stageId]} setClearCount={setClearCount}></Stage>
        <NextStageButton ></NextStageButton>
        <>{clearCount}</></div>
}

function Tile(props: TileProps) {
    return <button className="square" onClick={props.onClick} onContextMenu={props.onLeftClick}>{TileImage(props.value)}</button>
}


function TileImage(state: TileState) {
    if (state == "Flagged") {
        return <img src="/Flag.svg" alt={"Flag"} height="34px" width="34px"></img>
    } else if (state == "Hidden") {

    } else {
        return state.Value
    }
}

function Board(props: BoardProps) {
    console.log(props.board)
    let ret = []
    const height = props.board.length
    const width = props.board[0].length
    for (let i = 0; i < height; i++) {
        let row = []
        for (let j = 0; j < width; j++) {
            row.push(<Tile onClick={() => props.onClick(j, i)} onLeftClick={props.onLeftClick(j, i)} key={i * height + j} value={props.board[i][j]}></Tile>)
        }
        ret.push(<div key={i}>{row}</div>)
    }
    return <ul>{ret}</ul>
}

function Stage(props: StageProps) {
    // console.log(props.answers.length)
    const data = props.data;
    const [idx, setIdx] = useState(0)
    const initialBoards: Option<Board>[] = data.map(d => {
        // ランダム生成の場合
        if ("rule" in d) {
            return null;
        } else {
            return d.tiles;
        }
    });
    const initialAnswers: Option<BoardAnswer>[] = data.map(d => {
        // ランダム生成の場合
        if ("rule" in d) {
            return null;
        } else {
            return d.answer;
        }
    });
    const [boards, setBoards] = useState(initialBoards)
    const [answers, setAnswers] = useState(initialAnswers)
    function calcRemaining(i: number) {
        let remaining = 0;
        for (let y = 0; y < boards[i]!.length; y++) {
            for (let x = 0; x < boards[i]![y].length; x++) {
                if (boards[i]![y][x] == "Hidden" && answers[i]![y][x] == "Mine")
                    remaining += 1;
            }
        }
        return remaining
    }
    function calcHidden(i:number) {
        return boards[i]?.flat().filter(e => e == "Hidden").length;
    }
    function NextButton() {
        function onClick() {
            if (idx + 1 < data.length) {
                const d = data[idx + 1]
                console.log(d);
                if ("rule" in d && boards[idx + 1] == null) {
                    const newBoard: BoardWithAnswer = JSON.parse(generate_grid(d.rule, d.width, d.height, d.mines, d.reveal));
                    let newBoards = structuredClone(boards);
                    let newAnswers = structuredClone(answers);

                    newBoards[idx + 1] = newBoard.tiles;
                    newAnswers[idx + 1] = newBoard.answer;
                    setBoards(newBoards);
                    setAnswers(newAnswers);
                }
                setIdx(idx + 1);
            }
        }
        return <button onClick={onClick}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
      </svg>
      </button>
    }
    function PrevButton() {
        function onClick() {
            if (idx > 0) {
                setIdx(idx - 1);
            }
        }
        return <button onClick={onClick}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
      </button>

    }
    function onClick(i: number) {
        return (x: number, y: number) => {
            if (boards[i]![y][x] != "Hidden") {
                return;
            }
            let newBoards = structuredClone(boards);
            const v = answers[i]![y][x];
            if (v != "Mine") {
                console.log(v);
                newBoards[i]![y][x] = v;
                if (calcHidden(i) == 1) {
                    props.setClearCount(c => c + 1);
                }
            } else {
                alert("Failed...")
                const d = data[i];
                // ランダム面の場合
                if ("rule" in d) {
                    const newBoard: BoardWithAnswer = JSON.parse(generate_grid(d.rule, d.width, d.height, d.mines, d.reveal));
                    newBoards[i] = newBoard.tiles;
                    let newAnswers = structuredClone(answers);
                    newAnswers[i] = newBoard.answer;
                    setAnswers(newAnswers);
                }
                // 固定面の場合
                else {
                    newBoards[i] = d.tiles;
                }

            }
            setBoards(newBoards)

        }
    }
    function onLeftClick(i: number) {
        return (x: number, y: number) => {

            return (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                if (boards[i]![y][x] != "Hidden") {
                    return;
                }
                let newBoards = structuredClone(boards);
                event.preventDefault();

                if (answers[i]![y][x] == "Mine") {
                    newBoards[i]![y][x] = "Flagged"
                    if (calcHidden(i) == 1) {
                        props.setClearCount(c => c + 1);
                    }
                } else {
                    alert("Failed...")
                    const d = data[i];
                    // ランダム面の場合
                    if ("rule" in d) {
                        const newBoard: BoardWithAnswer = JSON.parse(generate_grid(d.rule, d.width, d.height, d.mines, d.reveal));
                        newBoards[i] = newBoard.tiles;
                        let newAnswers = structuredClone(answers);
                        newAnswers[i] = newBoard.answer;
                        setAnswers(newAnswers);
                    }
                    // 固定面の場合
                    else {
                        newBoards[i] = d.tiles;
                    }
                }
                setBoards(newBoards)

            }
        }
    }

    console.log(boards);
    return (
        <div>
            <>{calcRemaining(idx)}</>
            <Board board={boards[idx]!} answer={answers[idx]!} onClick={onClick(idx)} onLeftClick={onLeftClick(idx)}></Board>
            <PrevButton></PrevButton>
            <NextButton></NextButton>
        </div>
    )
}



