"use client";

import { useState } from "react";
import styles from "./CategorySelector.module.css";

export default function CategorySelector({ category }) {
  const [selectedCategory, setSelectedCategory] = useState(category);

  return <>
    <button className={selectedCategory === undefined ? styles.selected : styles.unselected} onClick={() => setSelectedCategory(undefined)}>Todas</button>
    <button className={selectedCategory === "countries" ? styles.selected : styles.unselected} onClick={() => setSelectedCategory("countries")}>Países</button>
    <button className={selectedCategory === "members" ? styles.selected : styles.unselected} onClick={() => setSelectedCategory("members")}>Membros</button>
    <button className={selectedCategory === "events" ? styles.selected : styles.unselected} onClick={() => setSelectedCategory("events")}>Eventos</button>
    <button className={selectedCategory === "reports" ? styles.selected : styles.unselected} onClick={() => setSelectedCategory("reports")}>Relatórios</button>
    <button className={selectedCategory === "settings" ? styles.selected : styles.unselected} onClick={() => setSelectedCategory("settings")}>Configurações</button>
  </>
}