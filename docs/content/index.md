# ryan zheng

hi! i'm ryan, a [cycling text - dynamically generated]

[Resume button] [About button]

---

# education

## University of California, Los Angeles • September 2024 - June 2028

B.S. in Physics, Data Science Engineering Minor; GPA: 3.875

- **Relevant Coursework**: Probability & Statistics, Stochastic Processes, Linear Algebra, Multivariable Calculus, Differential Equations, Discrete Math, Machine Learning, Data Mining

---

# awards & honors

- USA Physics Olympiad (USAPhO) Semifinalist (2023) - top 8% of 5,173 competitors
- IMC Prosperity 4 (2026) - top 8% of 18,803 teams
- ACM ICPC Break the Binary Medalist (2025) - 3rd place of 25 teams
- Sigma Pi Sigma Physics Honor Society
- ACM AI Projects Director
- Jane Street Puzzle Solver

---

# experience

## Amazon • Software Engineer Intern • June 2026 - present

Seattle, WA

- Architect a distributed ML experiment-orchestration platform (AWS Step Functions) that compiles declarative configs into fault-tolerant DAGs of multi-node GPU workloads, running unattended multi-day pipelines.
- Design an order-independent checkpoint-selection algorithm and parallelize evaluation fan-out to overlap with in-flight training; cut end-to-end runtime by >50% and inter-stage handoff latency from hours to seconds.
- Build a config compiler that deterministically deduplicates state machines, cut experiment setup from ~30 minutes to <1 minute, and streamline research iteration with agentic failure recovery.

## UCLA Scalable Analytics Institute • Machine Learning Researcher • January 2026 - present

Los Angeles, CA

- Restructure a 3.9 TB PET/CT archive into a longitudinal panel of 80 subjects × 4 timepoints, and evaluate 4 pretrained encoders. Forecast subject-level embeddings one timestep ahead under leave-one-subject-out cross-validation, beating a random-walk benchmark on 66% of held-out transitions while avoiding look-ahead bias.
- Build a vision-language model, injecting scan and forecast embeddings as image tokens into a LoRA-finetuned 8B language model with joint regression and classification heads; predict disease outcome 8 weeks ahead at 0.76 AUC / 72% vs. 0.58 / 50% scan-only under matched-budget ablation (10 LOSO runs). Submitting to ICLR.

## Scale AI • Machine Learning Intern • January 2025 - January 2026

San Francisco, CA (Remote)

- Built statistical evaluation rubrics and Dockerized agentic RL evaluation environments, supporting industry-standard AI benchmarks (e.g., Aider LLM Leaderboards) across 200+ datapoints and 6 clients.

---

# skills & interests

- **Technical**: C++, CMake, Python, NumPy, statsmodels, pandas, SciPy, PyTorch, R, SQL, Linux
- **Languages**: English (native), Mandarin (fluent)
- **Interests**: Skiing, tennis, jazz piano, competitive archery, game speedrunning (record holder), poker

---

# quantitative projects

## Perpetual Futures Funding Carry Strategy • May 2026 - present

Personal Project

- Backtest a funding-rate carry strategy on BTC and SOL perpetuals; find the edge survives up to 0.04% of ADV ($210K notional) before modeled slippage exceeds funding income. Achieve 0.8 Sharpe net of costs at optimal size vs. 2.1 gross.
- Build a C++ order book reconstruction and slippage simulation engine processing 400M+ historical events over a 12-month walk-forward period, decoupling market-data ingestion from simulation via a lock-free queue.
- Calibrate a square-root impact model via regression; gate entry on rolling Bayesian AR(1) funding persistence.

## S&P500 Return Forecasting • October 2025 - December 2025

ACM AI, Hull Tactical Kaggle Competition

- Ensembled daily-horizon forecasting models for S&P500 forward returns using gradient-boosted trees, feed-forward networks, and LSTMs. Achieved 1.48 Sharpe over a 6-month scoring period; top 22% of submissions.
- Scaled training across GPUs via gradient checkpointing and 8-bit optimizers, cutting training time by 60%.

---

# publications

Chen, Y., Jiao, J., & Zheng, R. (2024). Exploring changes in trip generation and impacts of built environment
between regular and essential trips: A study based on the contiguous United States. *Proceedings of the CICTP
2024 (pp. 3317–3326)*. Presented at the CICTP 2024. https://doi.org/10.1061/9780784485484.314
